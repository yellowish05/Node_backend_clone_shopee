const { UserInputError } = require('apollo-server');

const regions = [
  { id: 'uk-1', code: 1, name: 'Kyivskay obl.' },
  { id: 'uk-2', code: 2, name: 'Zhitomirskay obl.' },
  { id: 'uk-3', code: 3, name: 'Oddeskaya obl.' },
];

module.exports = async (obj, args, { user, dataSources: { repository } }) => {
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
  if (args.data.address) {
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

  const organization = await repository.organization.getByUser(user);
  return repository.organization.update(organization, {
    ...args.data,
    owner: user,
    address,
    billingAddress,
  });
};
