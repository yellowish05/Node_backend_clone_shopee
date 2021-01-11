const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'Brand';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  name: {
    type: String,
    required: true,
    index: true,
  },
  brandCategories: {
    type: [{
      type: String,
      ref: 'BrandCategory',
      index: true,
    }],
    default: []
  },
  productCategories: {
    type: [{
      type: String,
      ref: 'ProductCategory',
      index: true,
    }],
    default: [],
  },
  images: {
    type: [{
      type: String,
      ref: 'Asset',
    }],
    default: [],
  },
  hashtags: {
    type: [{
      type: String,
    }],
    default: [],
  },
});

module.exports = new model(collectionName, schema);
