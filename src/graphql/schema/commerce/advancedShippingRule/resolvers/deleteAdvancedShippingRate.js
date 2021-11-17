const path = require("path");
const { Validator } = require("node-input-validator");
const { UserInputError, ForbiddenError } = require("apollo-server");

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

module.exports = (_, { id }, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    { id },
    {
      id: "required",
    }
  );

  return validator.check().then((matched) => {
    if (!matched) {
      throw errorHandler.build(validator.errors);
    }
    return repository.advancedShippingRate
      .getById(id)
      .then((shippingRate) => {
        if (!shippingRate) {
          throw new UserInputError(
            `Advanced shipping rate with id "${id}" does not exist!`
          );
        }
        return repository.advancedShippingRule.getById(shippingRate.rule);
      })
      .then((shippingRule) => {
        if (!shippingRule) {
          throw new UserInputError("Not found the relevant shipping rule!");
        }
        if (shippingRule.owner !== user.id) {
          throw new ForbiddenError("Permission denied!");
        }
      })
      .then(() => repository.advancedShippingRate.delete(id))
      .then((result) => result.deletedCount === 1);
  });
};
