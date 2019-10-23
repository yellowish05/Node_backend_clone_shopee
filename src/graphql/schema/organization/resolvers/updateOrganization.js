
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

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const address = args.data.address ? {
    ...args.data.address,
    region: regions.find((r) => r.id === args.data.address.regionId),
    country: countries.find((c) => c.id === args.data.address.countryId),
  } : null;

  const billingAddress = args.data.address ? {
    ...args.data.address,
    region: regions.find((r) => r.id === args.data.billingAddress.regionId),
    country: countries.find((c) => c.id === args.data.billingAddress.countryId),
  } : null;

  return repository.organization.update(args.id, {
    address,
    billingAddress,
  }, { roles: ['USER'] });
};
