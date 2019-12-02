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
    regions: (_, args, { dataSources: { repository } }) => {
      const query = { country: args.filter.countryId };
      return repository.region.getAll(query);
    },
  },
};
