const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');
const { Currency, WeightUnitSystem, MarketType } = require('../lib/Enums');

const collectionName = 'ProductAttributes';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  variation: {
    type: Object,
    required: true,
    index: true,
  },
  price: {
    type: Number,
    required: true,
    index: true,
  },
  oldPrice: {
    type: Number,
  },
  asset: {
    type: String,
    ref: 'Asset',
  },
  quantity: {
    type: Number,
  },
  currency: {
    type: String,
    enum: Currency.toList(),
  },
  productId: {
    type: String,
    ref: 'Product',
  },
  // xinhua-11-05
  sku: {
    type: String,
    default: null,
  },
});

schema.indexes([
  { currency: 1, price: 1 },
]);

schema.methods.getTagName = function getTagName() {
  return `${collectionName}:${this._id}`;
};

module.exports = new model(collectionName, schema);
