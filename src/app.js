// HTTP SERVER
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const morgan = require('morgan');
const logger = require('../config/logger');
const repository = require('./repository');

const { corsDomain } = require(path.resolve('config'));
const apolloServerFactory = require(path.resolve('src/graphql'));
const { mongoClientCloseConnection } = require(path.resolve('config/mongoConnection'));
const webhookRouters = require('./webhooks');
const viewersRouters = require('./viewers');

process.on('SIGINT', () => {
  mongoClientCloseConnection();
});

const app = express();

// app.use(morgan('combined', { stream: logger.stream }));

app.get('/health', (req, res) => {
  res.send({ status: 'pass' });
});

app.use('/webhooks', webhookRouters);
app.use('/viewers', viewersRouters);

app.use(cors({
  origin: corsDomain,
  optionsSuccessStatus: 200,
}));

const apolloApp = express();
const apolloServer = apolloServerFactory({ repository });

apolloServer.applyMiddleware({
  app: apolloApp,
  path: '/',
  cors: corsDomain,
  disableHealthCheck: true,
});

const robots = require('./robots');

robots.startRobots();

app.use('/graphql', apolloApp);

const httpServer = createServer(app);
apolloServer.installSubscriptionHandlers(httpServer);

module.exports.httpServer = httpServer;
