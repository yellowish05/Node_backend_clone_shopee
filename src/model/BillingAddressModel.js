const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');
const AddressSchema = require('./AddressModel');

const collectionName = 'BillingAddress';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  addressId: {
    type: String,
    required: false,
  },
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
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  shippingAddress: {
    type: String,
    default: null,
  },
});

module.exports = new model(collectionName, schema);
