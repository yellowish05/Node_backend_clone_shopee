const { UserInputError } = require('apollo-server');

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

    return repository.organization.getByUser(user)
      .then((organization) => repository.organization.update(organization, {
        ...args.data,
        owner: user,
        address,
        billingAddress,
        carriers,
      }));
  });
