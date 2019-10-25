const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const schema = new Schema({
  ...uuidField,
  ...createdAtField,

  user: {
    type: String,
    ref: 'User',
    required: true,
  },
  source: String,
});

module.exports = new model('StreamSource', schema);
