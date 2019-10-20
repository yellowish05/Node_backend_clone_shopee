const express = require('express');
const jwt = require('express-jwt');
const { ApolloServer } = require('apollo-server-express');
const { AuthenticationError } = require('apollo-server');
const config = require('../../config');
const logger = require('../../config/logger');
const createSchema = require('./schema');
const AccessControl = require('../lib/AccessControl');
const userRepos = require('../datasource/user/repositories');
const authApi = require('../apisource/auth');

const schema = createSchema();

const databases = {
  user: userRepos,
};

const api = {
  auth: authApi,
};

module.exports = (app) => {
  const router = express.Router();

  router.use('/', jwt({
    secret: (req, payload, done) => {
      if (payload === undefined) {
        return done(new AuthenticationError('Missing secret'));
      }

      //   repositories.token.load(payload.id).then((res) => {
      //     if (res === null || res.secret === null) {
      //       return done(new AuthenticationError('Invalid token'));
      //     }

    //     return done(null, res.secret);
    //   });
    },
    credentialsRequired: false,
  }));

  router.use('/', (err, req, res, next) => {
    next();
  });

  const server = new ApolloServer({
    schema,
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
      const user = req.user ? await repositories.user.load(req.user.user_id) : null;
      const roles = user !== null ? user.roles : [];
      return { user, access: new AccessControl(roles) };
    },
    introspection: true,
    playground: true,
    engine: {
      apiKey: config.env === 'production' ? config.apolloEngineApiKey : null,
    },
    generateClientInfo: ({ request }) => {
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
      databases,
      api,
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
