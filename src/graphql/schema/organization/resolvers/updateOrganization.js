
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

module.exports = async (obj, args, { user, dataSources: { repository } }) => {
  const address = args.data.address ? {
    ...args.data.address,
    region: regions.find((r) => r.id === args.data.address.region),
    country: countries.find((c) => c.id === args.data.address.country),
  } : null;

  const billingAddress = args.data.billingAddress ? {
    ...args.data.billingAddress,
    region: regions.find((r) => r.id === args.data.billingAddress.region),
    country: countries.find((c) => c.id === args.data.billingAddress.country),
  } : null;

  const organization = await repository.organization.getByUser(user);
  return repository.organization.update(organization, {
    ...args.data,
    owner: user,
    address,
    billingAddress,
  });
};
