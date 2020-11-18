const { Schema, model } = require('mongoose');
const { StreamChannelStatus } = require('../lib/Enums');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'LiveStream';

const schema = new Schema({
  ...uuidField(collectionName),
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
  status: {
    type: String,
    enum: StreamChannelStatus.toList(),
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
  city: {
    type: String,
    ref: 'City',
  },
  preview: {
    type: [String],
    ref: 'Asset',
  },
  previewVideo: {
    type: String,
    ref: 'Asset',
  },
  channel: {
    type: String,
    ref: 'StreamChannel',
  },
  publicMessageThread: {
    type: String,
    ref: 'MessageThread',
    required: true,
  },
  privateMessageThreads: [{
    type: String,
    ref: 'MessageThread',
  }],
  products: [{
    type: String,
    ref: 'Product',
  }],
  realViews: {
    type: Number,
    required: true,
  },
  realLikes: {
    type: Number,
    required: true,
  },
  fakeViews: {
    type: Number,
    required: true,
  },
  fakeLikes: {
    type: Number,
    required: true,
  },
  length: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
  },
  startTime: {
    type: Date,
    default: null,
  }
});

schema.methods.getTagName = function getTagName() {
  return `LiveStream:${this._id}`;
};

module.exports = new model(collectionName, schema);
