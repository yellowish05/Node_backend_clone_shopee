const { Schema, model } = require('mongoose');
const AddressSchema = require('./AddressModel');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'Organization';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  owner: {
    type: String,
    ref: 'User',
  },
  name: String,
  type: String,
  address: {
    type: AddressSchema,
    required: false,
  },
  billingAddress: {
    type: AddressSchema,
    required: false,
  },
  payoutInfo: String,
  returnPolicy: String,
  carriers: [{
    type: String,
    ref: 'Carrier',
  }],
});

module.exports = new model(collectionName, schema);
