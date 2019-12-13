const path = require('path');
const { Schema, model } = require('mongoose');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const { Currency } = require(path.resolve('src/lib/Enums'));
const { shipengine } = require(path.resolve('config'));
const collectionName = 'DeliveryRateCache';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,

  carrier: {
    type: String,
    ref: 'Carrier',
    required: true,
    index: true,
  },
  rate_id: {
    type: String,
    required: true,
  },
  deliveryDays: {
    type: Number,
    required: true,
    index: true,
  },
  estimatedDeliveryDate: Date,
  carrierDeliveryDays: String,
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: Currency.toList(),
  },
});
schema.index({ createdAt: 1 }, { expires: shipengine.deliveryRateCacheTTL });

module.exports = new model(collectionName, schema);
