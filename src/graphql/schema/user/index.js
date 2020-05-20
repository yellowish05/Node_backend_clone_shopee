const { gql } = require('apollo-server');

const addUser = require('./resolvers/addUser');
const updateUser = require('./resolvers/updateUser');
const changePassword = require('./resolvers/changePassword');
const uploadBulkUsers = require('./resolvers/uploadBulkUsers');

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
      email: String
      phone: String
      countryCode: String
      address: AddressInput
      location: LatLngInput
      photo: ID
    }

    extend type Query {
      """Allows: authorized user"""
      me: User! @auth(requires: USER) 
    }

    extend type Mutation {
      addUser (data: RegistrationInput!): User!
      """Allows: authorized user"""
      updateUser (data: UserInput!): User! @auth(requires: USER)
      changePassword(email: String!, password: String,  verificationCode: String, newPassword: String!): Boolean!
      uploadBulkUsers(path: String!): [User!]! @auth(requires: USER)
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
    uploadBulkUsers
  },
  User: {
    photo(user, args, { dataSources: { repository } }) {
      return repository.asset.load(user.photo);
    },
    organization(user, args, { dataSources: { repository } }) {
      return repository.organization.getByUser(user.id);
    },
  },
};
