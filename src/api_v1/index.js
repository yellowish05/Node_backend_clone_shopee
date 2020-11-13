const express = require('express');
const bodyParser = require('body-parser');
const morganBody = require('morgan-body');
const path = require('path');
const logger = require('../../config/logger');

const translationRouters = require('./translation');
const tempRouters = require('./temp');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

morganBody(app, { stream: logger.stream, noColors: true, prettify: false });

app.use('/translation', translationRouters);

app.use('/temp', tempRouters); // this is for test and transform only

module.exports = app;
