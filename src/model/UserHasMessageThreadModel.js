const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'UserHasMessageThread';
const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  thread: {
    type: String,
    ref: 'MessageThread',
    required: true,
  },
  user: {
    type: String,
    ref: 'User',
    required: true,
  },
  readBy: {
    type: Date,
    required: true,
  },
});

schema.index({ thread: 1, user: 1 }, { unique: true });

module.exports = new model(collectionName, schema);
