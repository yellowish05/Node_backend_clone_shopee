const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const schema = new Schema({
  ...uuidField,
  ...createdAtField,

  streamer: {
    type: String,
    ref: 'User',
    required: true,
  },
  viewers: {
    type: [{
      type: String,
      ref: 'User',
    }],
    default: [],
  },
  title: {
    type: String,
    required: true,
  },
  experience: {
    type: String,
    required: true,
    index: true,
  },
  categories: {
    type: [String],
    required: true,
    index: true,
  },
  preview: {
    type: String,
    ref: 'Asset',
  },
});

module.exports = new model('LifeStream', schema);
