const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');
const LatitudeLongitudeSchema = require('./LatitudeLongitudeModel');

const collectionName = 'City';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  name: {
    type: String,
    required: true,
  },
  location: LatitudeLongitudeSchema,
  photo: {
    type: String,
    required: true,
  },
});

module.exports = new model(collectionName, schema);
