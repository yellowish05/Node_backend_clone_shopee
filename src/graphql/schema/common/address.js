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
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Address: {
    country({ country }, args, { dataSources: { repository } }) {
      return repository.country.getById(typeof country === 'object' ? country.id : country);
    },
  },
};
