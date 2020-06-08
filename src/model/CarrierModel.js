const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'Carrier';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  name: {
    type: String,
    required: true,
  },
  workInCountries: [{
    type: String,
    ref: 'Country',
  }],
});

module.exports = new model(collectionName, schema);
