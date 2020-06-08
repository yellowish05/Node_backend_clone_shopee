const { gql } = require('apollo-server');

const schema = gql`
    input AddressInput {
        street: String
        city: String
        region: ID!
        country: ID!
        zipCode: String
    }

    interface AddressInterface {
        street: String
        city: String
        region: Region
        country: Country!
        zipCode: String
    }

    type Address implements AddressInterface {
        street: String
        city: String
        region: Region
        country: Country!
        zipCode: String
    }

    type VerifiedAddress implements AddressInterface {
      street: String
      city: String
      region: Region
      country: Country!
      zipCode: String
      isDeliveryAvailable: Boolean!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Address: {
    country({ country }, args, { dataSources: { repository } }) {
      return repository.country.getById(typeof country === 'object' ? country.id : country);
    },
    region({ region }, args, { dataSources: { repository } }) {
      return repository.region.getById(typeof region === 'object' ? region.id : region);
    },
  },
  VerifiedAddress: {
    country({ country }, args, { dataSources: { repository } }) {
      return repository.country.getById(typeof country === 'object' ? country.id : country);
    },
    region({ region }, args, { dataSources: { repository } }) {
      return repository.region.getById(typeof region === 'object' ? region.id : region);
    },
  },
  AddressInterface: {
    __resolveType(address) {
      if (address.label) {
        return 'DeliveryAddress';
      }
      if (address.isDeliveryAvailable) {
        return 'VerifiedAddress';
      }

      return null;
    },
  },
};
