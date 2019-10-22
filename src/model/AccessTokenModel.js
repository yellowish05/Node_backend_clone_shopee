const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const schema = new Schema({
  ...uuidField,
  ...createdAtField,

  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  secret: {
    type: String,
    required: true,
  },
  ip: {
    type: String,
    required: false,
  },
  fingerprint: {
    type: String,
    required: false,
  },
});

module.exports = new model('AccessToken', schema);
