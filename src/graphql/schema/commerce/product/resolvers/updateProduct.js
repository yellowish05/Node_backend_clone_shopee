const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { ForbiddenError } = require('apollo-server');

const { InventoryLogType } = require(path.resolve('src/lib/Enums'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { id, data }, { dataSources: { repository }, user }) => {
  const validator = new Validator({ ...data, id }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
    title: 'required',
    description: 'required',
    shippingBox: 'required',
    // 'weight.value': 'required|decimal',
    // 'weight.unit': 'required',
    price: 'required|decimal',
    quantity: 'required|integer',
    currency: 'required',
    assets: 'required|length:6,1',
  });

  let product;

  validator.addPostRule(async (provider) => Promise.all([
    repository.product.getById(provider.inputs.id),
    repository.productCategory.getById(provider.inputs.category),
    repository.brand.getById(provider.inputs.brand),
    repository.shippingBox.findOne(provider.inputs.shippingBox),
  ])
    .then(([foundProduct, category, brand, shippingBox]) => {
      if (!foundProduct) {
        provider.error('id', 'custom', `Product with id "${provider.inputs.id}" doen not exist!`);
      }

      if (!category) {
        provider.error('category', 'custom', `Category with id "${provider.inputs.category}" doen not exist!`);
      }

      if (!brand) {
        provider.error('brand', 'custom', `Brand with id "${provider.inputs.brand}" doen not exist!`);
      }

      if (!shippingBox) {
        provider.error('shippingBox', 'custom', `Shipping Box with id "${provider.inputs.shippingBox}" does not exist!`);
      }

      product = foundProduct;
    }));

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => {
      if (user.id !== product.seller) {
        throw new ForbiddenError('You can not update product!');
      }
    })
    .then(async () => {

      let customCarrier;
      if (data.customCarrier) {
        customCarrier = await repository.customCarrier.findByName(data.customCarrier);
        if (!customCarrier) {
          throw new ForbiddenError(`Can not find customCarrier with "${data.customCarrier}" name`);
        }
      }

      const {
        quantity, price, discountPrice, ...productData
      } = data;

      product.title = productData.title;
      product.description = productData.description;
      product.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: data.discountPrice || data.price, currency: data.currency }).getCentsAmount();
      product.oldPrice = data.discountPrice ? CurrencyFactory.getAmountOfMoney({ currencyAmount: data.price, currency: data.currency }).getCentsAmount() : null;
      product.quantity = quantity
      product.customCarrier = customCarrier ? customCarrier.id : null;
      product.customCarrierValue = CurrencyFactory.getAmountOfMoney({ currencyAmount: data.customCarrierValue, currency: data.currency }).getCentsAmount();

      product.category = productData.category;
      product.brand = productData.brand;
      product.freeDeliveryTo = data.freeDeliveryTo;
      product.currency = productData.currency;
      product.shippingBox = data.shippingBox;
      // product.weight = data.weight;

      return Promise.all([
        product.save(),
        repository.productInventoryLog.getQuantityByProductId(product.id),
      ])
        .then(async ([updatedProduct, quantityInWarehouse]) => {
          if (quantityInWarehouse !== quantity) {
            const inventoryLog = {
              _id: uuid(),
              product: updatedProduct.id,
              shift: quantity - quantityInWarehouse,
              type: InventoryLogType.USER_ACTION,
            };
            await repository.productInventoryLog.add(inventoryLog);
          }
          return updatedProduct;
        });
    });
};
