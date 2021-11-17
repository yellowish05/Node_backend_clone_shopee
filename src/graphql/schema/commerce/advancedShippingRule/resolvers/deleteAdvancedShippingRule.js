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
    return repository.advancedShippingRule
      .getById(id)
      .then((shippingRule) => {
        if (!shippingRule) {
          throw new UserInputError(
            `Advanced shipping rule with id "${id}" does not exist!`
          );
        }

        if (shippingRule.owner !== user.id) {
          throw new ForbiddenError("Permission denied!");
        }

        return Promise.all([
          repository.advancedShippingRule.delete(id),
          repository.advancedShippingRate.deleteByRule(id),
        ]);
      })
      .then(([ruleDeleted]) => ruleDeleted.deletedCount === 1);
  });
};
