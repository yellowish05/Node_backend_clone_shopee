const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');
const AddressSchema = require('./AddressModel');

const collectionName = 'DelivaryAddress';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  label: {
    type: String,
  },
  address: {
    type: AddressSchema,
    required: true,
  },
  owner: {
    type: String,
    ref: 'user',
  },
  isDeliveryAvailable: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
});

module.exports = new model(collectionName, schema);
