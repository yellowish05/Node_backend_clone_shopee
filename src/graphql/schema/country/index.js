const { gql } = require('apollo-server');

const schema = gql`
    type Country {
      id: ID!
      name: String
    }

    extend type Query {
        countries: [Country]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    countries: () => ([
      { id: 'US', name: 'USA' },
      { id: 'CH', name: 'China' },
      { id: 'UK', name: 'Ukraine' },
      { id: 'GB', name: 'United Kingdom' },
    ]),
  },
};
