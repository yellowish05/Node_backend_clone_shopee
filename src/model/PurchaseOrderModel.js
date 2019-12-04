const { Schema, model } = require('mongoose');
const { Currency, PurchaseOrderStatus } = require('../lib/Enums');
const uuidField = require('./commonFields/UUIDField');
const createdAtField = require('./commonFields/CreatedAtField');

const collectionName = 'PurchaseOrder';

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  buyer: {
    type: String,
    ref: 'User',
    required: true,
    index: true,
  },
  deliveryAddress: {
    type: String,
    ref: 'DeliveryAddress',
    required: true,
  },
  items: [{
    type: String,
    ref: 'PurchaseOrderItem',
    required: true,
  }],
  payments: [{
    type: String,
    ref: 'PaymentTransaction',
  }],
  quantity: {
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
  isPaid: {
    type: Boolean,
    required: true,
    default: false,
  },
  status: {
    type: String,
    required: true,
    enum: PurchaseOrderStatus.toList(),
  },
});

schema.methods.getTagName = function getTagName() {
  return `PurchaseOrder:${this._id}`;
};

module.exports = new model(collectionName, schema);
