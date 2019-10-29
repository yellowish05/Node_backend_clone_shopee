const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');

const schema = new Schema({
  ...uuidField,

  joinedAt: {
    type: Date,
    default: Date.now,
  },
  leavedAt: {
    type: Date,
    default: null,
  },
  token: String,
  user: {
    type: String,
    ref: 'User',
  },
  channel: {
    type: String,
    ref: 'StreamChannel',
    required: true,
  },
  isPublisher: Boolean,
}, { _id: false });

module.exports = new model('StreamChannelParticipant', schema);
