const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const schema = new Schema({
  ...uuidField,
  ...createdAtField,

  streamer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  viewers: {
    type: [{
      type: Schema.Types.ObjectId,
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
  },
  categories: {
    type: [String],
    required: true,
  },
  preview: {
    type: Schema.Types.ObjectId,
    ref: 'Asset',
    required: true,
  },
  startAt: {
    type: Date,
    default: null,
  },
  finishAt: {
    type: Date,
    default: null,
  },
});

module.exports = new model('LifeStream', schema);
