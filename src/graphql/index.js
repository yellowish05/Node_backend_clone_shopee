const { ApolloServer } = require('apollo-server-express');
const config = require('../../config');
const logger = require('../../config/logger');
const createSchema = require('./schema');
const secureContextMiddlewareFactory = require('../lib/ApolloSecureContextMiddleware');

module.exports = ({ repository }) => new ApolloServer({
  schema: createSchema(),
  formatError: (error) => {
    const sendError = error;
    if (error.extensions.code === 'INTERNAL_SERVER_ERROR') {
      logger.error(JSON.stringify(error));
      sendError.message = 'Internal server error';
    }

    if (config.env === 'production') {
      delete sendError.extensions.exception;
    }

    return sendError;
  },
  context: async (request) => {
    const context = await secureContextMiddlewareFactory(repository)(request);
    if (request.connection) {
      context.dataSources = { repository };
    }
    return context;
  },
  subscriptions: {
    keepAlive: 10000,
  },
  introspection: true,
  playground: {
    settings: {
      'editor.theme': 'light',
    },
  },
  engine: {
    apiKey: config.env === 'production' ? config.apolloEngineApiKey : null,
    useUnifiedTopology: true,
  },
  generateClientInfo: ({ request }) => {
    // eslint-disable-next-line no-bitwise
    const headers = request.http & request.http.headers;
    if (headers) {
      return {
        clientName: headers['apollo-client-name'],
        clientVersion: headers['apollo-client-version'],
      };
    }
    return {
      clientName: 'Unknown Client',
      clientVersion: 'Unversioned',
    };
  },
  dataSources: () => ({ repository }),
});
