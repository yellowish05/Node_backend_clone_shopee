const express = require('express');
const jwt = require('express-jwt');
const { ApolloServer } = require('apollo-server-express');
const { AuthenticationError } = require('apollo-server');
const config = require('../../config');
const logger = require('../../config/logger');
const createSchema = require('./schema');
const repositoryFactory = require('../lib/RepositoryFactory');

module.exports = (app) => {
  const router = express.Router();

  // Dir paths are relative for "lib" dir
  const repository = repositoryFactory('../model', '../repository');

  router.use('/', jwt({
    // eslint-disable-next-line consistent-return
    secret: (req, payload, done) => {
      if (payload === undefined) {
        return done(new AuthenticationError('Missing secret'));
      }

      repository.accessToken.load(payload.id).then((res) => {
        if (res === null || res.secret === null) {
          return done(new AuthenticationError('Invalid token'));
        }

        return done(null, res.secret);
      });
    },
    credentialsRequired: false,
  }));

  router.use('/', (err, req, res, next) => {
    next();
  });

  const server = new ApolloServer({
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
    context: async ({ req }) => {
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
    dataSources: () => ({
      repository,
    }),
  });

  server.applyMiddleware({
    app: router,
    path: '/',
    cors: config.corsDomain,
    disableHealthCheck: true,
  });

  app.use(router);

  logger.info('API generated and ready');
};
