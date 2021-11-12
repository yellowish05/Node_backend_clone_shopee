/**
 * Advanced Shpiing Rule
 */
const path = require("path");
const { Schema, model } = require("mongoose");

const uuidField = require("./commonFields/UUIDField");
const createdAtField = require("./commonFields/CreatedAtField");

const collectionName = "AdvancedShipingRule";

const schema = new Schema({
  ...uuidField(collectionName),
  ...createdAtField,
  name: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    ref: "User",
  },
  country: {
    type: String,
    ref: "Country",
    required: true,
  },
  region: {
    type: String,
    ref: "Region",
  },
  city: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  // rates: [
  //   {
  //     type: String,
  //     ref: "AdvancedShippingRate",
  //   },
  // ],
});

module.exports = new model(collectionName, schema);
