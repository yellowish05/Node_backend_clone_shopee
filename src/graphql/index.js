const { ApolloServer } = require('apollo-server-express');
const config = require('../../config');
const logger = require('../../config/logger');
const createSchema = require('./schema');

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
  context: async ({ req, connection }) => {
    if (connection) {
      return connection.context;
    }

    const user = req.user ? await repository.user.load(req.user.user_id) : null;
    return { user };
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
