const { Schema } = require('mongoose');

const addressSchema = new Schema({
  street: String,
  city: String,
  region: {
    type: String,
    ref: 'Region',
  },
  country: {
    type: String,
    ref: 'Country',
  },
  zipCode: String,
  isDeliveryAvailable: {
    type: Boolean,
    default: false,
  },
}, { _id: false });

module.exports = addressSchema;
