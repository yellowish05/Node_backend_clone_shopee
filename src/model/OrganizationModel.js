const { Schema, model } = require('mongoose');
const AddressSchema = require('./AddressModel');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const schema = new Schema({
  ...uuidField,
  ...createdAtField,

  owner: {
    type: Schema.Types.ObjectId,
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
  sellingTo: String,
  domesticShippingCourier: {
    id: String,
    name: String,
    type: { type: [String] },
  },
  internationalShippingCourier: {
    id: String,
    name: String,
    type: { type: [String] },
  },
  returnPolicy: String,
});

module.exports = new model('Organization', schema);
