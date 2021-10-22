const path = require("path");
const niv = require("node-input-validator");

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const { ApolloError } = require("apollo-server");
const {
  providers: { EasyPost },
} = require(path.resolve("src/bundles/delivery"));
const errorHandler = new ErrorHandler();

module.exports = async (
  obj,
  { id, data },
  { dataSources: { repository }, user }
) => {
  niv.extend("greater", ({ value, args }, validator) => {
    return value > (args[0] || 0);
  });
  niv.extendMessages({
    greater: "The :attribute field must be greater than :value",
  });
  const validator = new niv.Validator(data, {
    label: "required",
    width: "required|greater:0|min:0|decimal",
    height: "required|greater:0|min:0|decimal",
    length: "required|greater:0|min:0|decimal",
    weight: "required|greater:0|min:0|decimal",
    unit: "required",
    unitWeight: "required",
  });

  return validator
    .check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return repository.shippingBox.findOne(id);
    })
    .then((shippingBox) => {
      if (!shippingBox) throw new Error(`ShippingBox with id ${id} does not exist!`);
      return EasyPost.addParcel(data).then((response) => {
        [
          "label",
          "width",
          "height",
          "length",
          "unit",
          "weight",
          "unitWeight",
        ].forEach((key) => {
          shippingBox[key] = data[key];
        });
        shippingBox.parcelId = response.id;
        return shippingBox.save();
      });
    })
    .catch((error) => {
      throw new ApolloError(
        `Failed to add Shipping Box. Original error: ${error.message}`,
        400
      );
    });
};
