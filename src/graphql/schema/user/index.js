const { gql } = require('apollo-server');

const register = require('./resolvers/register');

const schema = gql`
    type User {
      id: ID!
      email: String
    }

    input UserInput {
      email: String!
      password: String!
    }

    extend type Mutation {
      user: UserMutation!
    }

    type UserMutation {
      register (input: UserInput!): User!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    user() {
      return {};
    },
  },
  UserMutation: {
    register,
  },
};
