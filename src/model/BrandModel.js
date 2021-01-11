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
  brandCategories: [{
    type: String,
    ref: 'BrandCategory',
    index: true,
  }],
  productCategories: [{
    type: String,
    ref: 'ProductCategory',
    index: true,
  }],
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
