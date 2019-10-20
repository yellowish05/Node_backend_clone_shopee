const { gql } = require('apollo-server');
const { Validator } = require('node-input-validator');
const { ErrorHandler } = require('../../../lib/ErrorHandler');

const errorHandler = new ErrorHandler();

const schema = gql`
  input AuthGenTokenByPwdInput {
    email: String!
    password: String!
    ip: String
    userAgent: String
  }

  extend type Mutation {
    auth: AuthMutation!
  }

  type AuthMutation {
    genTokenByPwd(input: AuthGenTokenByPwdInput!): String!
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    auth() {
      return {};
    },
  },
  AuthMutation: {
    async genTokenByPwd(obj, args, { dataSources: { api } }) {
      const validator = new Validator(args.input, {
        email: 'required|email',
        password: 'required|minLength:6',
      });

      return validator.check()
        .then((matched) => {
          if (!matched) {
            throw errorHandler.build(validator.errors);
          }

          return api.auth.genTokenByPwd(args.input);
        })
    }
  },
};
