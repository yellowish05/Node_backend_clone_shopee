const path = require('path');
const { gql } = require('apollo-server');

const { VerificationEmailTemplate } = require(path.resolve('src/lib/Enums'));
const sendVerificationCode = require('./resolvers/sendVerificationCode');
const sendVerificationCode2Phone = require('./resolvers/sendVerificationCode2Phone');
const checkPhoneVerificationCode = require('./resolvers/checkPhoneVerificationCode');

const schema = gql`
  enum VerificationEmailTemplateEnum {
    ${VerificationEmailTemplate.toGQL()}
  }

  input PhoneInfo {
    phone: String!,
    countryCode: String!
  }

  input VerificationCodeInfo {
    request_id: String!
    code: String!
  }

  type VerificationInfo {
    id: String
  }

  type VerificationResult {
    result: Boolean!
    message: String
  }

  extend type Mutation {
    sendVerificationCode(email: String!, template: VerificationEmailTemplateEnum!): Boolean!
    sendVerificationCode2Phone(data: PhoneInfo!): VerificationInfo!
    checkPhoneVerificationCode(data: VerificationCodeInfo): VerificationResult!
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    sendVerificationCode,
    sendVerificationCode2Phone,
    checkPhoneVerificationCode,
  },
};
