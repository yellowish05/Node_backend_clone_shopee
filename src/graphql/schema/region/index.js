const { gql } = require('apollo-server');

const schema = gql`
    type Region {
      id: ID!
      code: Int
      name: String
    }

    input RegionFilter {
      countryId: ID!
    } 

    extend type Query {
        regions(filter: RegionFilter!): [Region]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    regions: () => ([
      { id: 'uk-1', code: 1, name: 'Kyivskay obl.' },
      { id: 'uk-2', code: 2, name: 'Zhitomirskay obl.' },
      { id: 'uk-3', code: 3, name: 'Oddeskaya obl.' },
    ]),
  },
};
