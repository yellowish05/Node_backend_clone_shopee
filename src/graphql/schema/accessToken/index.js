const path = require('path');
const { gql } = require('apollo-server');

const { LoginProvider } = require(path.resolve('src/lib/Enums'));

const generateAccessToken = require('./resolvers/generateAccessToken');
const generateAccessTokenByOAuth2 = require('./resolvers/generateAccessTokenByOAuth2');

const schema = gql`
  enum LoginProvider {
    ${LoginProvider.toGQL()}
  }

  input LoginInput {
    email: String!
    password: String!
    ip: String
    userAgent: String
  }

  input OAuth2LoginInput {
    provider: LoginProvider!
    token: String!
  }

  extend type Mutation {
    generateAccessToken(data: LoginInput!): String!
    generateAccessTokenByOAuth2(data: OAuth2LoginInput!): String!
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    generateAccessToken,
    generateAccessTokenByOAuth2,
  },
};
