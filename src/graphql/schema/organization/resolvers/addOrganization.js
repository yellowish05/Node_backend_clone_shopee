const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args.data, {
    name: 'required',
    type: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return args.data.carriers ? Promise.all(
        args.data.carriers.map((carrierId) => repository.carrier.getById(carrierId))
          .then((carrier) => {
            if (!carrier) {
              throw new UserInputError('Carrier does not exists', { invalidArgs: 'carriers' });
            }

            return carrier;
          }),
      ) : Promise.resolve([]);
    })
    .then(async (carriers) => {
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

      let billingAddress = null;
      if (args.data.billingAddress) {
        const billingAddressCountry = await repository.country.getById(args.data.billingAddress.country);
        if (!billingAddressCountry) {
          throw new UserInputError('Country does not exists', { invalidArgs: 'billingAddress' });
        }

        const billingAddressRegion = await repository.region.getById(args.data.billingAddress.region);
        if (!billingAddressRegion) {
          throw new UserInputError('Region does not exists', { invalidArgs: 'address' });
        }

        billingAddress = {
          ...args.data.address,
          region: billingAddressRegion,
          country: billingAddressCountry,
        };
      }


      return repository.organization.create({
        ...args.data,
        _id: uuid(),
        owner: user,
        address,
        billingAddress,
        carriers,
      });
    });
};
