const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = 'MessageThread';
const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  participants: [{
    type: String,
    ref: 'User',
    required: true,
  }],
  tags: [String],
});

module.exports = new model(collectionName, schema);
