const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { Geocoder } = require(path.resolve('src/lib/Geocoder'));

const errorHandler = new ErrorHandler();

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
      let address = null;
      if (args.data.address) {
        const addressCountry = await repository.country.getById(args.data.address.country);
        if (!addressCountry) {
          throw new UserInputError('Country does not exists', { invalidArgs: 'address' });
        }

        const addressRegion = await repository.region.getById(args.data.address.region);
        if (!addressRegion) {
          throw new UserInputError('Region does not exists', { invalidArgs: 'address' });
        }

        address = {
          ...args.data.address,
          region: addressRegion,
          country: addressCountry,
        };
      }

      try {
        if (location && !address) {
          address = await Geocoder.reverse(location);
          const geocodedCountry = await repository.country.getById(address.country.id);
          if (!geocodedCountry) {
            throw new UserInputError('Country does not exists', { invalidArgs: 'location' });
          }
          address.country = geocodedCountry.id;
        } else if (!location && address) {
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
