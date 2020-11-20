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
  productCategories: [{
    type: String,
    ref: 'ProductCategory',
    index: true,
  }],
  images: [{
    type: String,
    ref: 'Asset',
  }]
});

module.exports = new model(collectionName, schema);
