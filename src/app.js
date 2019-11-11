// HTTP SERVER
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const repositoryFactory = require('./lib/RepositoryFactory');
const { corsDomain } = require('../config');
const apolloServerFactory = require('./graphql');
const { mongoClientCloseConnection } = require('../config/mongoConnection');

process.on('SIGINT', () => {
  mongoClientCloseConnection();
});

// Dir paths are relative for "lib" dir
const repository = repositoryFactory('../model', '../repository');

const app = express();

app.get('/health', (req, res) => {
  res.send({ status: 'pass' });
});

app.use(cors({
  origin: corsDomain,
  optionsSuccessStatus: 200,
}));

const apolloServer = apolloServerFactory({ repository });

apolloServer.applyMiddleware({
  app,
  path: '/graphql',
  cors: corsDomain,
  disableHealthCheck: true,
});

const httpServer = createServer(app);
apolloServer.installSubscriptionHandlers(httpServer);

module.exports.httpServer = httpServer;
