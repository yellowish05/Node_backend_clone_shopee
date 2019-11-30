const { UserInputError } = require('apollo-server');

const regions = [
  { id: 'uk-1', code: 1, name: 'Kyivskay obl.' },
  { id: 'uk-2', code: 2, name: 'Zhitomirskay obl.' },
  { id: 'uk-3', code: 3, name: 'Oddeskaya obl.' },
];

const activity = {
  async verifyCarriers(ids, repository) {
    if (ids) {
      return Promise.all(ids.map((carrierId) => repository.carrier.getById(carrierId)
        .then((carrier) => {
          if (!carrier) {
            throw new UserInputError(`Carrier ${carrierId} does not exists`, { invalidArgs: 'carriers' });
          }

          return carrier;
        })));
    }
    return Promise.resolve(null);
  },
};

module.exports = async (obj, args, { user, dataSources: { repository } }) => activity.verifyCarriers(args.data.carriers, repository)
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

    return repository.organization.getByUser(user)
      .then((organization) => repository.organization.update(organization, {
        ...args.data,
        owner: user,
        address,
        billingAddress,
        carriers,
      }));
  });
