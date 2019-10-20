const fetch = require('node-fetch');
const { createHttpLink } = require('apollo-link-http');
const { ApolloClient } = require('apollo-client');
const { InMemoryCache } = require('apollo-cache-inmemory');
const { onError } = require('apollo-link-error');
const { ApolloLink } = require('apollo-link');
const { print } = require('graphql/language/printer');
const https = require('https');
const { split } = require('apollo-link');
const { env } = require('../../../config');
const logger = require('../../../config/logger');

const { apis: { auth } } = require('../../../config');
const createFactory = require('./create');
const genTokenByPwdFactory = require('./genTokenByPwd');

const httpLinkOptions = {
  uri: auth,
  fetch
}

// if (env === 'development') {
  // httpLinkOptions.fetchOptions = {
  //   agent: new https.Agent({ rejectUnauthorized: false }),
  // };
// }

const linkError = onError(({
  graphQLErrors, networkError, response, operation,
}) => {
  if (operation) {
    logger.error(`[GraphQL Operation] query: ${print(operation.query)}, variables: ${JSON.stringify(operation.variables)}`);
  }

  if (response) {
    response.errors.forEach(error => logger.error(`[GraphQL errors] ${JSON.stringify(error)}`));
  }

  if (graphQLErrors) {
    graphQLErrors.map(({ message, locations, path }) => logger.error(
      `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`,
    ));
  }

  if (networkError) {
    if (networkError.statusCode) {
      logger.error(`[Network error][status: ${networkError.statusCode}]: ${networkError}`);
    } else {
      logger.error(`[Network error]: ${networkError}`);
    }
  }
});

const httpLink = ApolloLink.from([
  linkError,
  createHttpLink(httpLinkOptions),
]);

const defaultOptions = {
  watchQuery: {
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  },
};

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  // defaultOptions,
});

module.exports.create = createFactory(client);
module.exports.genTokenByPwd = genTokenByPwdFactory(client);
