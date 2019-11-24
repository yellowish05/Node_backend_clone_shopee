const { gql } = require('apollo-server');

const addUser = require('./resolvers/addUser');
const updateUser = require('./resolvers/updateUser');
const changePassword = require('./resolvers/changePassword');

const schema = gql`
    type User {
      id: ID!
      email: String!
      name: String
      phone: String
      address: Address
      location: LatLng
      photo: Asset
      organization: Organization
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
      photo: ID
    }

    """Allows: authorized user"""
    extend type Query {
      me: User! @auth(requires: USER) 
    }

    extend type Mutation {
      addUser (data: RegistrationInput!): User!
      """Allows: authorized user"""
      updateUser (data: UserInput!): User! @auth(requires: USER)
      changePassword(email: String!, password: String,  verificationCode: String, newPassword: String!): Boolean!
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
    changePassword,
  },
  User: {
    photo(user, args, { dataSources: { repository } }) {
      return repository.asset.load(user.photo);
    },
    organization(user, args, { dataSources: { repository } }) {
      return repository.organization.getByUser(user);
    },
  },
};
