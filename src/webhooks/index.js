const express = require('express');
const bodyParser = require('body-parser');
const morganBody = require('morgan-body');
const logger = require('../../config/logger');


const paymentWireCardAction = require('./payment/wirecard');
const deliveryShipEngineAction = require('./delivery/shipengine');
const getStripeAction = require('./payment/stripe');

const path = require('path');
const { payment } = require(path.resolve('config'));
const stripe = require("stripe")(payment.providers.secret);
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

morganBody(app, { stream: logger.stream, noColors: true, prettify: false });

// List of included webhooks
app.post('/payment/wirecard', paymentWireCardAction);
app.get('/delivery/shipengine', deliveryShipEngineAction);
app.post('/payment/stripe', getStripeAction);

module.exports = app;
