const { gql } = require('apollo-server');

const addUser = require('./resolvers/addUser');
const addUserBySocial = require('./resolvers/addUserBySocial');
const addUserByPhone = require('./resolvers/addUserByPhone');
const updateUser = require('./resolvers/updateUser');
const changePassword = require('./resolvers/changePassword');
const changeDeviceId = require('./resolvers/changeDeviceId');
const uploadBulkUsers = require('./resolvers/uploadBulkUsers');

const schema = gql`
    type User {
      id: ID!
      email: String
      name: String
      phone: String
      address: Address
      location: LatLng
      photo: Asset
      organization: Organization
      roles: [String]! @auth(requires: ADMIN) 
    }

    type UserInfo {
      id: ID!
      email: String
      name: String
      phone: String
      address: Address
      location: LatLng
      photo: Asset
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

    input SocialLoginInput {
      provider: LoginProvider!
      token: String!
    }

    input PhoneLoginInput {
      phone: String!,
      countryCode: String!
      password: String!
    }


    extend type Query {
      getUserById(id: ID!): UserInfo!
      getUserByPhone(phone: String!): User
      getUserByEmail(email: String!): User
      getUserByName(name: String!): User
      """Allows: authorized user"""
      me: User! @auth(requires: USER) 
      generateChatToken: String! @auth(requires: USER)
    }

    extend type Mutation {
      addUser (data: RegistrationInput!): User!
      addUserByPhone (data: PhoneLoginInput!): User!
      addUserBySocial (data: SocialLoginInput!): User!
      """Allows: authorized user"""
      updateUser (data: UserInput!): User! @auth(requires: USER)
      changePassword(email: String!, password: String,  verificationCode: String, newPassword: String!): Boolean!
      changeDeviceId(deviceId: String!): Boolean! @auth(requires: USER)
      uploadBulkUsers(path: String!): [User!]! @auth(requires: USER)
      requestResetPassword(email: String, phone: String): Boolean!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    me: async (obj, args, { user, dataSources: { repository } }) => {
      if (!user.streamToken) {
        const userUpdate = await repository.user.update(user.id, {});
        return userUpdate;
      } else {
        return user;
      }
    },
    generateChatToken: async (obj, __, { user, dataSources: { repository }}) => {
      if (!user.streamToken) {
        const userUpdate = await repository.user.update(user.id, {});
        return userUpdate.streamToken;
      } else {
        return user.streamToken;
      }
    },
    getUserById: async (_, { id }, { dataSources: { repository } }) => (
      repository.user.getById(id)
    ),
    getUserByPhone: async (_, { phone }, { dataSources: { repository } }) => {
      return repository.user.findByPhone(phone);
    },
    getUserByEmail: async (_, { email }, { dataSources: { repository } }) => {
      return repository.user.findByEmail(email)
    },
    getUserByName: async (_, { name }, { dataSources: { repository } }) => {
      return repository.user.findByName(name);
    },
  },
  Mutation: {
    addUser,
    addUserBySocial,
    addUserByPhone,
    updateUser,
    changePassword,
    uploadBulkUsers,
    changeDeviceId
  },
  User: {
    photo(user, args, { dataSources: { repository } }) {
      return repository.asset.load(user.photo);
    },
    organization(user, args, { dataSources: { repository } }) {
      return repository.organization.getByUser(user.id);
    },
  },
  UserInfo: {
    photo(user, args, { dataSources: { repository } }) {
      return repository.asset.load(user.photo);
    },
  }
};
