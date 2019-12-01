const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();


const regions = [
  { id: 'uk-1', code: 1, name: 'Kyivskay obl.' },
  { id: 'uk-2', code: 2, name: 'Zhitomirskay obl.' },
  { id: 'uk-3', code: 3, name: 'Oddeskaya obl.' },
];

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(data, {
    label: 'required',
    street: 'required',
    city: 'required',
    region: 'required',
    country: 'required',
    zipCode: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return repository.country.getById(data.country);
    })
    .then((country) => {
      if (!country) {
        throw new UserInputError('Country does not exists', { invalidArgs: 'country' });
      }

      const region = regions.find((r) => r.id === data.region);

      if (!region) {
        throw new UserInputError('Region does not exists', { invalidArgs: 'region' });
      }

      return repository.deliveryAddress.create({
        region,
        owner: user.id,
        ...data,
      });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to add Delivery Address. Original error: ${error.message}`, 400);
    });
};
