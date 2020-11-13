const { Schema, model } = require('mongoose');
const { LanguageList } = require('../lib/Enums');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'Language';

const schema = new Schema({
  _id: {
    type: String,
    enum: LanguageList.toList(),
    // default: LanguageList.ENG  // mode: iso-639-3
    default: LanguageList.EN  // mode: iso-639-1
  },
  ...createdAtField,

  name: {
    type: String,
  },
});

module.exports = new model(collectionName, schema);
