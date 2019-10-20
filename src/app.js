// HTTP SERVER
const express = require('express');
const cors = require('cors');

// GraphQL - Apollo
const apollo = require('./graphql');

// Config
const { corsDomain } = require('../config');

// Mongo connection
const { mongoClientCloseConnection } = require('../config/mongoConnection');

process.on('SIGINT', () => {
  mongoClientCloseConnection();
});

const app = express();

app.use(cors({
  origin: corsDomain, // Be sure to switch to your production domain
  optionsSuccessStatus: 200,
}));

// Endpoint to check if the API is running
app.get('/health', (req, res) => {
  res.send({ status: 'pass' });
});

// Append apollo to our API
apollo(app);

module.exports = app;
