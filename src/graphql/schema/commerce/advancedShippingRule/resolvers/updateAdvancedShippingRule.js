const path = require("path");
const niv = require("node-input-validator");
const { UserInputError } = require("apollo-server");

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

module.exports = (_, { id, data }, { dataSources: { repository }, user }) => {
  const validator = new niv.Validator(
    { id, ...data },
    {
      id: "required",
      name: "required|string",
      country: "required|string",
      isActive: "boolean",
    }
  );

  return validator
    .check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return Promise.all([
        repository.advancedShippingRule.getById(id),
        repository.country.getById(data.country),
        data.region ? repository.region.getById(data.region) : true,
      ]).then(([rule, country, region]) => {
        if (!rule) {
          validator.addError(
            "id",
            "existence",
            `AdvancedShippingRule with id "${id}" does not exist.`
          );
          throw errorHandler.build(validator.errors);
        }
        if (rule.owner !== user.id) {
          validator.addError("id", "ownership", "Permission denied!");
        }
        if (!country) {
          validator.addError("country", "required", "Country does not exist!");
        }
        if (!region) {
          validator.addError("region", "required", "Region does not exist!");
        }
        if (Object.keys(validator.errors).length) throw errorHandler.build(validator.errors);

        return rule;
      });
    })
    .then((rule) => {
      rule.name = data.name;
      rule.country = data.country;
      rule.region = data.region;
      rule.city = data.city;
      rule.isActive = data.isActive;

      return rule.save();
    });
};
