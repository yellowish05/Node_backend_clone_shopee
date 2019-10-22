const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

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
  roles: {
    type: [String],
  },
  isApprovedEmail: {
    type: Boolean,
    default: false,
  },
});

module.exports = new model('User', schema);
