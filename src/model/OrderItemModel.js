const { Schema, model } = require('mongoose');
const { Currency, OrderItemStatus } = require('../lib/Enums');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'OrderItem';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  status: {
    type: String,
    enum: OrderItemStatus.toList(),
    required: true,
    default: OrderItemStatus.CREATED,
  },
  buyer: {
    type: String,
    ref: 'User',
  },
  product: {
    type: String,
    ref: 'product',
    index: true,
  },
  seller: {
    type: String,
    ref: 'User',
  },
  title: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  originPrice: {
    type: Number,
    required: true,
  },
  originCurrency: {
    type: String,
    enum: Currency.toList(),
  },
  originDeliveryPrice: {
    type: Number,
    required: true,
  },
  originDeliveryCurrency: {
    type: String,
    enum: Currency.toList(),
  },
  price: {
    type: Number,
    required: true,
  },
  deliveryPrice: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: Currency.toList(),
  },
  total: {
    type: Number,
    required: true,
  },
});

module.exports = new model(collectionName, schema);
