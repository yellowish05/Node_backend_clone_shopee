const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { InventoryLogType } = require(path.resolve('src/lib/Enums'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { ForbiddenError } = require('apollo-server');

const errorHandler = new ErrorHandler();

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
    const validator = new Validator(data, {
        productId: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
        color: 'required',
        size: 'required',
        price: 'required|decimal',
        // discountPrice: 'required|decimal',
        quantity: 'required|integer',
        asset: 'required',
    });

    let foundProduct;

    validator.addPostRule(async (provider) => Promise.all([
        repository.product.getById(provider.inputs.productId),
    ])
    .then(([product]) => {
        if (!product) {
            provider.error('Product', 'custom', `Product with id "${provider.inputs.productId}" does not exist!`);
        }
        foundProduct = product;
    }));

    return validator.check()
    .then(async (matched) => {
        if (!matched) {
            throw errorHandler.build(validator.errors);
            }

        const productAttrId = uuid();
        const inventoryId = uuid();

        const {
            quantity, price, ...productData
        } = data;

        discountPrice = data.discountPrice ? data.discountPrice : 0;

        productData._id = productAttrId;
        productData.quantity = quantity;
        productData.discountPrice = CurrencyFactory.getAmountOfMoney({ currencyAmount: discountPrice || data.price, currency: data.currency }).getCentsAmount();
        productData.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: discountPrice || data.price, currency: data.currency }).getCentsAmount();

        foundProduct.attrs.push(productAttrId);
        const inventoryLog = {
            _id: inventoryId,
            product: productId,
            productAttribute: productAttrId,
            shift: quantity,
            type: InventoryLogType.USER_ACTION,
        };

        return Promise.all([
            repository.productAttributes.create(productData),
            foundProduct.save(),
            repository.productInventoryLog.add(inventoryLog),
        ])
        .then(async ([productAttr, updatedProduct]) => {
            return productAttr;
        });
    });
};
