const path = require('path');
const { Schema, model } = require('mongoose');

const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'Theme';


const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  name: {
    type: String,
    required: true,
    unique: true,
  },
  thumbnail: {
    type: String,
    ref: 'Asset',
    required: true,
  },
  hashtags: {
    type: [{
      type: String,
    }],
    default: [],
  },
  productCategories: {
    type: [{
      type: String,
      ref: 'ProductCategory',
    }],
    default: [],
  },
  brandCategories: {
    type: [{
      type: String,
      ref: 'BrandCategory',
    }],
    default: [],
  },
  brands: {
    type: [{
      type: String,
      ref: 'Brand',
    }],
    default: [],
  },
});

module.exports = new model(collectionName, schema);