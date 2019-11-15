const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { Geocoder } = require(path.resolve('src/lib/Geocoder'));

const errorHandler = new ErrorHandler();

const countries = [
  { id: 'US', name: 'USA' },
  { id: 'CH', name: 'China' },
  { id: 'UK', name: 'Ukraine' },
  { id: 'GB', name: 'United Kingdom' },
];

const regions = [
  { id: 'uk-1', code: 1, name: 'Kyivskay obl.' },
  { id: 'uk-2', code: 2, name: 'Zhitomirskay obl.' },
  { id: 'uk-3', code: 3, name: 'Oddeskaya obl.' },
];

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args.data, {
    phone: 'phoneNumber',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      if (args.data.photo) {
        const asset = await repository.asset.load(args.data.photo);
        if (!asset) {
          throw new UserInputError(`Asset ${args.data.photo} does not exist`, { invalidArgs: 'photo' });
        }
      }

      let { location } = args.data;
      let address = args.data.address ? {
        ...args.data.address,
        region: regions.find((r) => r.id === args.data.address.regionId),
        country: countries.find((c) => c.id === args.data.address.countryId),
      } : null;

      try {
        if (location && !address) {
          address = await Geocoder.reverse(location);
        } else if (!args.location && address) {
          location = await Geocoder.geocode(address);
        }
      } catch (error) {
        throw new ApolloError(`Failed to get geolocation. Original error: ${error.message}`, 400);
      }

      return repository.user.update(user.id, {
        name: args.data.name,
        phone: args.data.phone,
        photo: args.data.photo,
        location,
        address,
      });
    });
};
