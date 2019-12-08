const routes = require('express').Router();
const bodyParser = require('body-parser');

const paymentWireCardAction = require('./payment/wirecard');
const deliveryShipEngineAction = require('./delivery/shipengine');

routes.use(bodyParser.urlencoded({ extended: false }));
routes.use(bodyParser.json());

// List of included webhooks
routes.post('/payment/wirecard', paymentWireCardAction);
routes.get('/delivery/shipengine', deliveryShipEngineAction);

module.exports = routes;
