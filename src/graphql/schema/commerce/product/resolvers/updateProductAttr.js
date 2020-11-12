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
  }, {});

  let productAttr;
  let product;

  validator.addPostRule(async (provider) => Promise.all([
    repository.productAttributes.getById(provider.inputs.id),
    repository.product.getById(provider.inputs.productId)
  ])
    .then(([foundProductAttr, productInfo]) => {
      if (!foundProductAttr) {
        provider.error('id', 'custom', `ProductAttr with id "${provider.inputs.id}" doen not exist!`);
      }
      if (!productInfo) {
        provider.error('id', 'custom', `Product with id "${provider.inputs.productId}" doen not exist!`);
      }
      productAttr = foundProductAttr;
      product = productInfo;
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
      const {
        quantity, price, discountPrice, ...productAttrData
      } = data;

      productAttr.variation = productAttrData.variation ? productAttrData.variation : productAttr.variation;
      productAttr.currency = productAttrData.currency ? productAttrData.currency : productAttr.currency;
      productAttr.price = price ? CurrencyFactory.getAmountOfMoney({ currencyAmount: discountPrice || price, currency: productAttr.currency }).getCentsAmount() : productAttr.price;
      productAttr.oldPrice = discountPrice ? CurrencyFactory.getAmountOfMoney({ currencyAmount: price, currency: productAttr.currency }).getCentsAmount() : productAttr.oldPrice;
      productAttr.quantity = quantity ? quantity : productAttr.quantity;
      productAttr.asset = productAttrData.asset ? productAttrData.asset : productAttr.asset;
      
      return Promise.all([
        productAttr.save(),
        repository.productInventoryLog.getByProductIdAndAttrId(product.id, productAttr.id),
      ])
        .then(async ([updatedproductAttr, inventory]) => {
          if (!inventory) {
            const inventoryLog = {
              _id: uuid(),
              product: product.id,
              productAttribute: updatedproductAttr.id,
              shift: updatedproductAttr.quantity,
              type: InventoryLogType.USER_ACTION,
            };
            inventory = await repository.productInventoryLog.add(inventoryLog)
          }
          await repository.productInventoryLog.update(inventory.id, updatedproductAttr.quantity);
          return updatedproductAttr;
        });
    });
};
