const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { InventoryLogType } = require(path.resolve('src/lib/Enums'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(data, {
    title: 'required',
    description: 'required',
    price: 'required|integer',
    quantity: 'required|integer',
    currency: 'required',
    assets: 'required|length:6,1',
  });

  validator.addPostRule(async (provider) => Promise.all([
    repository.productCategory.getById(provider.inputs.category),
    repository.brand.getById(provider.inputs.brand),
  ])
    .then(([category, brand]) => {
      if (!category) {
        provider.error('category', 'custom', `Category with id "${provider.inputs.category}" doen not exist!`);
      }

      if (!brand) {
        provider.error('brand', 'custom', `Brand with id "${provider.inputs.brand}" doen not exist!`);
      }
    }));

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => {
      const productId = uuid();
      const inventoryId = uuid();

      const {
        quantity, price, discountPrice, ...productData
      } = data;
      productData._id = productId;
      productData.seller = user.id;
      productData.price = discountPrice || price;
      productData.oldPrice = discountPrice ? price : null;

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
