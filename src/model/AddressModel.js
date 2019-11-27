const { Schema } = require('mongoose');

const addressSchema = new Schema({
  label: String,
  street: String,
  city: String,
  region: {
    type: {
      id: String,
      code: Number,
      name: String,
    },
    required: false,
  },
  country: {
    type: String,
    ref: 'Country',
  },
  zipCode: String,
}, { _id: false });

module.exports = addressSchema;
