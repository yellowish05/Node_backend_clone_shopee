const uuid = require("uuid/v4");
const path = require("path");
const { Validator } = require("node-input-validator");
const { UserInputError, ApolloError } = require("apollo-server");

const { InventoryLogType } = require(path.resolve("src/lib/Enums"));
const { CurrencyFactory } = require(path.resolve("src/lib/CurrencyFactory"));
const { CurrencyService } = require(path.resolve("src/lib/CurrencyService"));

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const { ForbiddenError } = require("apollo-server");

const errorHandler = new ErrorHandler();

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    data,
    {
      title: "required",
      description: "required",
      shippingBox: "required",
      // 'weight.value': 'required|decimal',
      // 'weight.unit': 'required',
      price: "required|decimal",
      quantity: "required|integer",
      currency: "required",
      assets: "required|length:9,1",
      thumbnailId: "required"
    },
    {
      "assets.length": "You can not upload more than 9 images!",
    }
  );

  // to-do: validate attrs.asset;
  validator.addPostRule(async (provider) =>
    Promise.all([
      repository.productCategory.getById(provider.inputs.category),
      repository.brand.getById(provider.inputs.brand),
      repository.shippingBox.findOne(provider.inputs.shippingBox),
      repository.asset.load(provider.inputs.thumbnailId)
    ]).then(([category, brand, shippingBox, thumbnail]) => {
      if (!category) {
        provider.error(
          "category",
          "custom",
          `Category with id "${provider.inputs.category}" does not exist!`
        );
      }

      if (!brand) {
        provider.error(
          "brand",
          "custom",
          `Brand with id "${provider.inputs.brand}" does not exist!`
        );
      }

      if (!shippingBox) {
        provider.error(
          "shippingBox",
          "custom",
          `Shipping Box with id "${provider.inputs.shippingBox}" does not exist!`
        );
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

  return validator
    .check()
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
      productData.customCarrier = customCarrier ? customCarrier.id : null;
      productData.customCarrierValue = CurrencyFactory.getAmountOfMoney({ currencyAmount: data.customCarrierValue || 0, currency: data.currency }).getCentsAmount();
      productData.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: data.discountPrice || data.price, currency: data.currency }).getCentsAmount();
      if (thumbnailId) { productData.thumbnail = thumbnailId; }
      productData.oldPrice = data.discountPrice ? CurrencyFactory.getAmountOfMoney({ currencyAmount: data.price, currency: data.currency }).getCentsAmount() : null;
      productData.isFeatured = data.isFeatured || false;
      productData.slug = data.slug || "";
      productData.metaDescription = data.metaDescription || false;
      productData.metaTags = data.metaTags || [];
      productData.seoTitle = data.seoTitle || "";
      // resize thumbnail
      const thumbnail = await repository.asset.getById(thumbnailId);
      if (thumbnail &&  (
        !thumbnail.resolution ||
        (thumbnail.resolution.width && thumbnail.resolution.width > 200))) {
        await AssetService.resizeImage({ assetId: thumbnailId, width: 200 });
      }
      // options
      productData.attrs = [];

      const amountOfMoney = CurrencyFactory.getAmountOfMoney({
        currencyAmount: data.price,
        currency: data.currency,
      });
      const sortPrice = await CurrencyService.exchange(
        amountOfMoney,
        "USD"
      ).then((exchangedMoney) => exchangedMoney.getCentsAmount());
      productData.sortPrice = sortPrice;

      productData.wholesaleEnabled = data.wholesaleEnabled || false;
      productData.metrics = [];
      if (data.metrics && data.metrics.length > 0) {
        data.metrics.forEach((metricItem) => {
          productData.metrics.push({
            metricUnit: metricItem.metricUnit,
            minCount: metricItem.minCount || 0,
            unitPrice: {
              amount: CurrencyFactory.getAmountOfMoney({
                currencyAmount: metricItem.unitPrice.amount,
                currency: metricItem.unitPrice.currency,
              }).getCentsAmount(),
              currency: metricItem.unitPrice.currency,
            },
            quantity: metricItem.quantity,
          });
        });
      }
      const inventoryLog = {
        _id: inventoryId,
        product: productId,
        shift: quantity,
        type: InventoryLogType.USER_ACTION,
      };
      return Promise.all([
        repository.product.create(productData),
        repository.productInventoryLog.add(inventoryLog),
      ]);
    })
    .then(([product]) => product)
    .then(async (product) => {
      if (data.attrs && data.attrs.length && data.attrs.length > 0) {
        let productAttrs = [];
        product.attrs = [];
        data.attrs.forEach(attr => {
          const productAttrId = uuid();
          product.attrs.push(productAttrId);
          productAttrs.push({
            _id: productAttrId,
            productId: product._id,
            quantity: attr.quantity,
            price: CurrencyFactory.getAmountOfMoney({ currencyAmount: attr.price || attr.discountPrice, currency: attr.currency }).getCentsAmount(), //attr.price,
            discountPrice: CurrencyFactory.getAmountOfMoney({ currencyAmount: attr.discountPrice || attr.price, currency: attr.currency }).getCentsAmount(), //attr.discountPrice,
            currency: attr.currency,
            color: attr.color,
            size: attr.size,
            asset: attr.asset,
          });
        });
        
        await Promise.all(productAttrs.map(attr => {
          repository.productAttributes.create(attr);
        }));
        await product.save();
      }
      return product;
    });
};
