const { gql } = require('apollo-server');

const schema = gql`
    type Country {
      id: ID!
      name(locale: Locale): String
      currency: Currency!
    }

    extend type Query {
        countries: [Country]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    countries(_, args, { dataSources: { repository } }) {
      return repository.country.getAll();
    },
  },
};
