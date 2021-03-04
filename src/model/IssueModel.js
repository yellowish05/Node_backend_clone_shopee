const path = require('path');
const { Schema, model } = require('mongoose');

const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');
const { IssueStatus } = require('../lib/Enums');

const collectionName = 'Issue';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  issuer: {
    type: String,
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    index: true,
  },
  message: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    ref: "IssueCategory",
  },
  note: String,
  status: {
    type: String,
    enum: IssueStatus.toList(),
    default: IssueStatus.CREATED,
  },
});

module.exports = new model(collectionName, schema);