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
  channel: {
    type: String,
    ref: 'StreamChannel',
  },
  statistics: {
    type: {
      duration: {
        type: Number,
        default: 0,
      },
      likes: {
        type: Number,
        defaut: 0,
      },
      viewers: {
        type: Number,
        default: 0,
      },
    },
    default: { duration: 0, viewers: 0, likes: 0 },
  },
});

module.exports = new model('LifeStream', schema);
