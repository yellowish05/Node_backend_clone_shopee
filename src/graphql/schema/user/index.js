const { gql } = require('apollo-server');

const addUser = require('./resolvers/addUser');

const schema = gql`
    type User {
      id: ID!
      email: String!
      roles: [String]! @auth(requires: ADMIN) 
    }

    input RegistrationInput {
      email: String!
      password: String!
    }

    extend type Query {
      me: User! @auth(requires: USER) 
    }

    extend type Mutation {
      addUser (data: RegistrationInput!): User!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    me: async (obj, args, { user }) => user,
  },
  Mutation: {
    addUser,
  },
};
