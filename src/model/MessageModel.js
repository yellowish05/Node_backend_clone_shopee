const { Schema, model } = require('mongoose');
const { MessageType } = require('../lib/Enums');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'Message';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  author: {
    type: String,
    ref: 'User',
    required: true,
  },
  thread: {
    type: String,
    ref: 'MessageThread',
    required: true,
  },
  type: {
    type: String,
    enum: MessageType.toList(),
  },
  data: {
    type: String,
    required: true,
  },
});

module.exports = new model(collectionName, schema);
