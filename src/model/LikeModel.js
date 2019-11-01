const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const schema = new Schema({
  ...uuidField,
  ...createdAtField,

  entity: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    ref: 'User',
    required: true,
  },
}, { _id: false });

schema.index({ entity: 1, user: 1 }, { unique: true });

module.exports = new model('Like', schema);
