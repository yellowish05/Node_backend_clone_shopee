const { gql } = require('apollo-server');
const path = require('path');

const { GenderType } = require(path.resolve('src/lib/Enums'));

const addUser = require('./resolvers/addUser');
const addUserBySocial = require('./resolvers/addUserBySocial');
const addUserByPhone = require('./resolvers/addUserByPhone');
const updateUser = require('./resolvers/updateUser');
const changePassword = require('./resolvers/changePassword');
const changeDeviceId = require('./resolvers/changeDeviceId');
const uploadBulkUsers = require('./resolvers/uploadBulkUsers');
const requestResetPassword = require('./resolvers/requestResetPassword');
const followUser = require('./resolvers/followUser');
const unfollowUser = require('./resolvers/unfollowUser');

const schema = gql`
    enum GenderType {
      ${GenderType.toGQL()}
    }

    type Color {
      background: String!
      text: String!
    }

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
      isOnline: Boolean
      gender: GenderType
      color: Color
      followStats: FollowStats
    }

    type FollowStats {
      following(skip: Int = 0, limit: Int = 10): [User]
      nFollowing: Int!
      followers(skip: Int = 0, limit: Int = 10): [User]
      nFollowers: Int!
    }

    type UserInfo {
      id: ID!
      email: String
      name: String
      phone: String
      address: Address
      location: LatLng
      photo: Asset
      color: Color
      followStats: FollowStats
    }

    input RegistrationInput {
      email: String!
      password: String!
    }

    input ColorInput {
      background: String!
      text: String!
    }

    input UserInput {
      name: String
      email: String
      phone: String
      countryCode: String
      address: AddressInput
      location: LatLngInput
      photo: ID
      gender: GenderType
      color: ColorInput
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

      followUser(id: ID!): Boolean @auth(requires: USER)
      unfollowUser(id: ID!): Boolean @auth(requires: USER)
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
    changeDeviceId,
    requestResetPassword,
    followUser,
    unfollowUser,
  },
  User: {
    photo(user, args, { dataSources: { repository } }) {
      return repository.asset.load(user.photo);
    },
    organization(user, args, { dataSources: { repository } }) {
      return repository.organization.getByUser(user.id);
    },
    isOnline(user, _, { dataSources: { repository }}) {
      return !!user.isOnline;
    },
    followStats(user) { return user }
  },
  UserInfo: {
    photo(user, args, { dataSources: { repository } }) {
      return repository.asset.load(user.photo);
    },
    followStats(user) { return user }
  },
  FollowStats: {
    following(user, { skip, limit }, { dataSources: { repository } }) {
      const userIds = user.following.filter(tag => tag.includes('User:')).map(tag => tag.replace('User:', '')).slice(skip, limit);
      return repository.user.paginate({ query: { _id: {$in: userIds} }, page: { skip: 0, limit } });
    },
    nFollowing(user, _, { dataSources: { repository } }) {
      return (user.following || []).length;
    },
    followers(user, { skip, limit }, { dataSources: { repository } }) {
      return repository.user.paginate({ query: { following: user.getTagName() }, page: { skip, limit }});
    },
    nFollowers(user, _, { dataSources: { repository}}) {
      return repository.user.countAll({ following: user.getTagName() });
    },
  }
};
