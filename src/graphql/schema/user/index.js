const { gql } = require('apollo-server');

const addUser = require('./resolvers/addUser');
const updateUser = require('./resolvers/updateUser');

const schema = gql`
    type User {
      id: ID!
      email: String!
      name: String
      phone: String
      address: Address
      location: LatLng
      roles: [String]! @auth(requires: ADMIN) 
    }

    input RegistrationInput {
      email: String!
      password: String!
    }

    input UserInput {
      name: String
      phone: String
      address: AddressInput
      location: LatLngInput
    }

    extend type Query {
      me: User! @auth(requires: USER) 
    }

    extend type Mutation {
      addUser (data: RegistrationInput!): User!
      updateUser (data: UserInput!): User! @auth(requires: USER) 
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    me: async (obj, args, { user }) => user,
  },
  Mutation: {
    addUser,
    updateUser,
  },
};
