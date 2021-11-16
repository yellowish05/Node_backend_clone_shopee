const path = require('path');
const niv = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

module.exports = (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new niv.Validator(data, {
    name: 'required|string',
    country: 'required|string',
    isActive: 'boolean',
  });

  return validator.check()
    .then(async matched => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return Promise.all([
        repository.country.getById(data.country),
        data.region ? repository.region.getById(data.region) : true,
      ])
        .then(([country, region]) => {
          if (!country) {
            validator.addError('country', 'required', 'Country does not exist!');
          }
          if (!region) {
            validator.addError('region', 'required', 'Region does not exist!');
          }
          if (!country || !region) throw errorHandler.build(validator.errors);
        });
    })
    .then(() => repository.advancedShippingRule.create({ ...data, owner: user.id }));
};
