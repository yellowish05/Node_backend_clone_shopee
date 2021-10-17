const { Schema, model } = require('mongoose');
const { DeliveryOrderStatus, Currency } = require('../lib/Enums');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'DeliveryPriceGroup';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  currency: {
    type: String,
    enum: Currency.toList(),
  },
  price: {
    type: Number,
    required: true,
  },
  deliveryOrders: [{
    type: String,
    ref: 'DeliveryOrder',
  }],
});

module.exports = new model(collectionName, schema);
