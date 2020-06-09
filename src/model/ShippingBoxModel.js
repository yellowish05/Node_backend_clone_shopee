const path = require('path');
const { Schema, model } = require('mongoose');

const { SizeUnitSystem } = require(path.resolve('src/lib/Enums'));
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'ShippingBox';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  label: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    ref: 'User',
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  length: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    enum: SizeUnitSystem.toList(),
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
});

module.exports = new model(collectionName, schema);
