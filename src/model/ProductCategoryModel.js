const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');


const collectionName = 'ProductCategory';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  parent: {
    type: String,
    default: null,
  },
  level: {
    type: Number,
    default: 1,
  },
  name: {
    type: String,
    required: true,
    index: true,
  },
  liveStreamCategory: {
    type: String,
    ref: 'LiveStreamCategory',
    default: null,
    index: true,
  },
});

module.exports = new model(collectionName, schema);
