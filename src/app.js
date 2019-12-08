// HTTP SERVER
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');

const repositoryFactory = require(path.resolve('src/lib/RepositoryFactory'));
const { corsDomain } = require(path.resolve('config'));
const apolloServerFactory = require(path.resolve('src/graphql'));
const { mongoClientCloseConnection } = require(path.resolve('config/mongoConnection'));
const webhookRouters = require('./webhooks');

process.on('SIGINT', () => {
  mongoClientCloseConnection();
});

// Dir paths are relative for "lib" dir
const repository = repositoryFactory(path.resolve('src/model'), path.resolve('src/repository'));

const app = express();

app.get('/health', (req, res) => {
  res.send({ status: 'pass' });
});

app.use('/webhooks', webhookRouters);

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
