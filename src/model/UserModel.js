const path = require('path');
const { Schema, model } = require('mongoose');

const { LoginProvider } = require(path.resolve('src/lib/Enums'));
const createdAtField = require('./commonFields/CreatedAtField');
const uuidField = require('./commonFields/UUIDField');
const LatitudeLongitudeSchema = require('./LatitudeLongitudeModel');
const AddressSchema = require('./AddressModel');
const UserSettingsSchema = require('./UserSettingsModel');

const collectionName = 'User';

const providerObject = {};

LoginProvider.toList().forEach((provider) => {
  providerObject[provider] = {
    type: String,
    required: false,
  };
});

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  email: {
    type: String,
    unique: true,
    sparse: true,
    required: false,
    index: true,
    get: (email) => (!email || email.split('@')[1] === '@tempmail.tmp' ? null : email),
  },
  password: {
    type: String,
    required: false,
  },
  phone: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  photo: {
    type: String,
    ref: 'Asset',
  },
  address: {
    type: AddressSchema,
    required: false,
  },
  location: {
    type: LatitudeLongitudeSchema,
    required: false,
  },
  roles: {
    type: [String],
  },
  isApprovedEmail: {
    type: Boolean,
    default: false,
  },
  settings: {
    type: UserSettingsSchema,
    required: true,
  },
  providers: {
    type: providerObject,
    default: {},
  },
  blackList: {
    type: [{
      type: String,
      ref: 'User',
    }],
    default: [],
  },
  isOnline: {
    type: Boolean,
    required: false,
  },
  device_id: {      // for push notification from onesignal
    type: String,
    default: ''
  }
});

module.exports = new model(collectionName, schema);
