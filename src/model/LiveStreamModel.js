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
  preview: {
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
  privatMessageThread: [{
    type: String,
    ref: 'MessageThread',
  }],
});

module.exports = new model(collectionName, schema);
