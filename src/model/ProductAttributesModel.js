const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');
const { Currency, WeightUnitSystem, MarketType } = require('../lib/Enums');

const collectionName = 'ProductAttributes';

const schema = new Schema({
    ...uuidField(collectionName),
    ...createdAtField,
    color: {
      type: String,
      required: true,
      index: true,
    },
    size: {
      type: String,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      index: true,
    },
    discountPrice: {
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
    }
  });
  
  schema.indexes([
    { currency: 1, price: 1 },
  ]);
  
  schema.methods.getTagName = function getTagName() {
    return `${collectionName}:${this._id}`;
  };
  
  module.exports = new model(collectionName, schema);
  