const { gql } = require('apollo-server');

const schema = gql`
    type Query {
        health: String
    }

    type Mutation {
        _empty: String
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    health: () => 'pass',
  },
};
