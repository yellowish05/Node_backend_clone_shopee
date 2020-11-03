const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { InventoryLogType } = require(path.resolve('src/lib/Enums'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { ForbiddenError } = require('apollo-server');

const errorHandler = new ErrorHandler();

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(data, {
    title: 'required',
    description: 'required',
    shippingBox: 'required',
    // 'weight.value': 'required|decimal',
    // 'weight.unit': 'required',
    price: 'required|decimal',
    quantity: 'required|integer',
    currency: 'required',
    assets: 'required|length:9,1',
    thumbnailId: "required"
  }, {
    'assets.length': "You can not upload more than 9 images!"
  });

  validator.addPostRule(async (provider) => Promise.all([
    repository.productCategory.getById(provider.inputs.category),
    repository.brand.getById(provider.inputs.brand),
    repository.shippingBox.findOne(provider.inputs.shippingBox),
    repository.asset.load(provider.inputs.thumbnailId)
  ]).then(([category, brand, shippingBox, thumbnail]) => {
      if (!category) {
        provider.error('category', 'custom', `Category with id "${provider.inputs.category}" does not exist!`);
      }

      if (!brand) {
        provider.error('brand', 'custom', `Brand with id "${provider.inputs.brand}" does not exist!`);
      }

      if (!shippingBox) {
        provider.error('shippingBox', 'custom', `Shipping Box with id "${provider.inputs.shippingBox}" does not exist!`);
      }
      if (!thumbnail) {
        provider.error(
          "thumbnailId",
          "custom",
          `Asset with id "${provider.inputs.thumbnailId}" does not exist!`
        );
      }
    })
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      let customCarrier;
      if (data.customCarrier) {
        customCarrier = await repository.customCarrier.findByName(data.customCarrier);
        if (!customCarrier) {
          throw new ForbiddenError(`Can not find customCarrier with "${data.customCarrier}" name`);
        }
      }

      const productId = uuid();
      const inventoryId = uuid();

      const { quantity, price, discountPrice, thumbnailId, ...productData } = data;

      productData._id = productId;
      productData.seller = user.id;
      productData.shippingBox = data.shippingBox;
      // productData.weight = data.weight;
      productData.quantity = quantity;
      productData.sortPrice = 
      productData.customCarrier = customCarrier ? customCarrier.id : null;
      productData.customCarrierValue = CurrencyFactory.getAmountOfMoney({ currencyAmount: data.customCarrierValue || 0, currency: data.currency }).getCentsAmount();
      productData.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: data.discountPrice || data.price, currency: data.currency }).getCentsAmount();
      productData.thumbnail = thumbnailId;
      productData.oldPrice = data.discountPrice ? CurrencyFactory.getAmountOfMoney({ currencyAmount: data.price, currency: data.currency }).getCentsAmount() : null;
      
      // options
      productData.attrs = [];
      
      const amountOfMoney = CurrencyFactory.getAmountOfMoney(
        { currencyAmount: data.price, currency: data.currency })
      const sortPrice = await CurrencyService.exchange(amountOfMoney, "USD")
        .then((exchangedMoney) => exchangedMoney.getCentsAmount());
      productData.sortPrice = sortPrice

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
