const routes = require('express').Router();
const bodyParser = require('body-parser');

const paymentWireCardAction = require('./payment/wirecard');
const deliveryShipEngineAction = require('./delivery/shipengine');

routes.use(bodyParser.urlencoded({ extended: true }));
routes.use(bodyParser.json());
routes.use(bodyParser.raw());

// List of included webhooks
routes.post('/payment/wirecard', paymentWireCardAction);
routes.get('/delivery/shipengine', deliveryShipEngineAction);

module.exports = routes;
