const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'ProductVariation';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  values: [{
    type: String,
    required: true,
  }],
  keyName: {
    type: String,
    required: true,
  },
  displayName: {
    type: String,
    required: true,
  },
});

module.exports = new model(collectionName, schema);
