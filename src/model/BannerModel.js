const { Schema, model } = require('mongoose');
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');
const { BannerAdType, BannerLayoutType, BannerType } = require('../lib/Enums');

const collectionName = 'Banner';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  name: {
    type: String,
    required: true,
    unique: true,
  },
  page: {
    type: String,
  },
  sitePath: {
    type: String,
    required: true,
  },
  assets: {
    type: [{
      type: String,
      ref: 'Asset',
    }],
    default: [],
  },
  urls: {
    type: {
      type: String,
    },
    default: [],
  },
  adType: {
    type: String,
    enum: BannerAdType.toList(),
  },
  size: {
    type: {
      width: Number,
      height: Number,
    },
  },
  type: {
    type: String,
    enum: BannerType.toList(),
  },
  layout: {
    type: String,
    enum: BannerLayoutType.toList()
  },
  time: {
    type: Number
  },
});

module.exports = new model(collectionName, schema);
