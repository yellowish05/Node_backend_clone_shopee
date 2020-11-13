const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');

const schema = new Schema({
  ...createdAtField,

  tag: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true,
  },
  message: {
    type: String,
    required: false,
  },
});

schema.index({ tag: 1, user: 1 }, { unique: true });

module.exports = new model('Rating', schema);
