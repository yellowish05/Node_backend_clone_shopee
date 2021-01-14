const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');


const collectionName = 'ProductCategory';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  order: {
    type: Number,
  },
  parent: {
    type: String,
    default: null,
  },
  parents: [{
    type: String,
  }],
  hasChildren: {
    type: Boolean,
    required: true,
    default: false,
  },
  image: {
    type: String,
    ref: 'Asset',
    default: null,
  },
  level: {
    type: Number,
    default: 1,
  },
  name: {
    type: String,
    required: true,
    index: true,
  },
  liveStreamCategory: {
    type: String,
    ref: 'LiveStreamCategory',
    default: null,
    index: true,
  },
  hashtags: {
    type: [{
      type: String,
    }],
    default: [],
  },
  slug: {
    type: String,
  },
  // productVariations: {
  //   type: [{
  //     type: String,
  //     ref: 'ProductVariation',
  //   }],
  //   default: [],
  // },
});

schema.versionKey = false;

module.exports = new model(collectionName, schema);
