/**
 * Advanced Shipping Rule Item
 */
const path = require("path");
const { Schema, model } = require("mongoose");

const uuidField = require("./commonFields/UUIDField");
const createdAtField = require("./commonFields/CreatedAtField");
const { Currency, WeightUnitSystem } = require("../lib/Enums");

const collectionName = "AdvancedShippingRate";

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  rule: {
    type: String,
    ref: "AdvancedShippingRule",
    required: true,
  },
  priceFrom: Number,
  priceTo: Number,
  currency: {
    type: String,
    enum: Currency.toList(),
    default: Currency.USD,
  },
  weightFrom: Number,
  weightTo: Number,
  unit: {
    type: String,
    enum: WeightUnitSystem.toList(),
    default: WeightUnitSystem.KILOGRAM,
  },
  rate: {
    type: Number,
    required: true,
  },
  days: {
    type: Number,
    required: true,
  },
});

module.exports = new model(collectionName, schema);
