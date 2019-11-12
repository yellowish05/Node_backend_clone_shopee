const { gql } = require('apollo-server');
const {
  AuthenticationError, ForbiddenError, UserInputError, ApolloError,
} = require('apollo-server');
const config = require('../../../../config');

const schema = gql`
    extend type Query {
      errorNotAuthorize: String!
      errorNoPermissions: String!
      errorWrongInput: String!
      errorHandledError: String!
      errorUnhandledError: String!
      errorWithoutAnswer: String!
    }
`;

module.exports.typeDefs = config.env === 'production' ? [] : [schema];

module.exports.resolvers = config.env === 'production' ? {} : {
  Query: {
    errorNotAuthorize() {
      throw new AuthenticationError('UNAUTHENTICATED');
      return 'neverreturn';
    },
    errorNoPermissions() {
      throw new ForbiddenError('FORBIDDEN');
      return 'neverreturn';
    },
    errorWrongInput() {
      throw new UserInputError('Wrong user input', { invalidArgs: 'name' });
      return 'neverreturn';
    },
    errorUnhandledError() {
      throw new Error('Unhandled server error');
      return 'neverreturn';
    },
    errorHandledError() {
      throw new ApolloError('Handled server error', 400);
      return 'neverreturn';
    },
    errorWithoutAnswer() {
      return new Promise((resolve, reject) => {});
    },
  },
};
