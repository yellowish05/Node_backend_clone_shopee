const path = require('path');
const { gql } = require('apollo-server');

const { VerificationEmailTemplate } = require(path.resolve('src/lib/Enums'));
const sendVerificationCode = require('./resolvers/sendVerificationCode');

const schema = gql`
  enum VerificationEmailTemplateEnum {
    ${VerificationEmailTemplate.toGQL()}
  }

    extend type Mutation {
      sendVerificationCode(email: String!, template: VerificationEmailTemplateEnum!): Boolean!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    sendVerificationCode,
  },
};
