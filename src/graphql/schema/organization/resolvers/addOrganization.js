const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

const regions = [
  { id: 'uk-1', code: 1, name: 'Kyivskay obl.' },
  { id: 'uk-2', code: 2, name: 'Zhitomirskay obl.' },
  { id: 'uk-3', code: 3, name: 'Oddeskaya obl.' },
];

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

        address = {
          ...args.data.address,
          region: regions.find((r) => r.id === args.data.address.region),
          country: addressCountry,
        };
      }

      let billingAddress = null;
      if (args.data.billingAddress) {
        const billingAddressCountry = await repository.country.getById(args.data.billingAddress.country);
        if (!billingAddressCountry) {
          throw new UserInputError('Country does not exists', { invalidArgs: 'billingAddress' });
        }

        billingAddress = {
          ...args.data.address,
          region: regions.find((r) => r.id === args.data.billingAddress.region),
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
