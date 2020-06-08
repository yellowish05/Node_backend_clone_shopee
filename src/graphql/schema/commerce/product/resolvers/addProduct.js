const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { InventoryLogType } = require(path.resolve('src/lib/Enums'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(data, {
    title: 'required',
    description: 'required',
    shippingBox: 'required',
    'weight.value': 'required|decimal',
    'weight.unit': 'required',
    price: 'required|decimal',
    quantity: 'required|integer',
    currency: 'required',
    assets: 'required|length:6,1',
  });

  validator.addPostRule(async (provider) => Promise.all([
    repository.productCategory.getById(provider.inputs.category),
    repository.brand.getById(provider.inputs.brand),
    repository.shippingBox.findOne(provider.inputs.shippingBox),
  ])
    .then(([category, brand, shippingBox]) => {
      if (!category) {
        provider.error('category', 'custom', `Category with id "${provider.inputs.category}" does not exist!`);
      }

      if (!brand) {
        provider.error('brand', 'custom', `Brand with id "${provider.inputs.brand}" does not exist!`);
      }

      if (!shippingBox) {
        provider.error('shippingBox', 'custom', `Shipping Box with id "${provider.inputs.shippingBox}" does not exist!`);
      }
    }));

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      const productId = uuid();
      const inventoryId = uuid();

      const {
        quantity, price, discountPrice, ...productData
      } = data;
      productData._id = productId;
      productData.seller = user.id;
      productData.shippingBox = data.shippingBox;
      productData.weight = data.weight;
      productData.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: data.discountPrice || data.price, currency: data.currency }).getCentsAmount();
      productData.oldPrice = data.discountPrice ? CurrencyFactory.getAmountOfMoney({ currencyAmount: data.price, currency: data.currency }).getCentsAmount() : null;

      const inventoryLog = {
        _id: inventoryId,
        product: productId,
        shift: quantity,
        type: InventoryLogType.USER_ACTION,
      };

      return Promise.all([
        repository.product.create(productData),
        repository.productInventoryLog.add(inventoryLog),
      ])
        .then(([product]) => product);
    });
};
