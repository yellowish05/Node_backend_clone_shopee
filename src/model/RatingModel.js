const path = require('path');
const { Schema, model } = require('mongoose');
const { LanguageList } = require(path.resolve('src/lib/Enums'));
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');

const collectionName = "Rating";

const schema = new Schema({
  ...uuidField(collectionName),
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
  order: {
    type: String,
    ref: 'OrderItem',
  },
  lang: {
    type: String,
    enum: LanguageList.toList(),
    required: true,
  },
});

schema.index({ tag: 1, user: 1 }, { unique: true });

module.exports = new model(collectionName, schema);
