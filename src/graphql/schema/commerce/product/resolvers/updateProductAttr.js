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

  validator.addPostRule(async (provider) => Promise.all([
    repository.productAttributes.getById(provider.inputs.id),
  ])
    .then(([foundProductAttr]) => {
      if (!foundProductAttr) {
        provider.error('id', 'custom', `ProductAttr with id "${provider.inputs.id}" doen not exist!`);
      }
      productAttr = foundProductAttr;
    }));

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(async () => {
      const {
        quantity, price, discountPrice, ...productAttrData
      } = data;

      productAttr.color = productAttrData.color == "" ? productAttr.color : productAttrData.color;
      productAttr.size = productAttrData.size == "" ? productAttr.size : productAttrData.size;
      // productAttr.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: data.discountPrice || data.price, currency: data.currency }).getCentsAmount();
      // productAttr.oldPrice = data.discountPrice ? CurrencyFactory.getAmountOfMoney({ currencyAmount: data.price, currency: data.currency }).getCentsAmount() : null;
      productAttr.price = price ? price : productAttr.price;
      productAttr.discountPrice = discountPrice ? discountPrice : productAttr.discountPrice;
      productAttr.quantity = quantity ? quantity : productAttr.quantity;
      productAttr.asset = productAttrData.asset ? productAttrData.asset : productAttr.asset;
      productAttr.currency = productAttrData.currency ? productAttrData.currency : productAttr.currency;

      return Promise.all([
        productAttr.save(),
      ])
        .then(async ([updatedproductAttr]) => {
          return updatedproductAttr;
        });
    });
};
