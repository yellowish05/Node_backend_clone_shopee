const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');
const LatitudeLongitudeSchema = require('./LatitudeLongitudeModel');
const AddressSchema = require('./AddressModel');

const schema = new Schema({
  ...uuidField,
  ...createdAtField,

  email: {
    type: String,
    unique: true,
    sparse: true,
    required: false,
    index: true,
  },
  password: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  photo: {
    type: String,
    ref: 'Asset',
  },
  address: {
    type: AddressSchema,
    required: false,
  },
  location: {
    type: LatitudeLongitudeSchema,
    required: false,
  },
  roles: {
    type: [String],
  },
  isApprovedEmail: {
    type: Boolean,
    default: false,
  },
});

module.exports = new model('User', schema);
