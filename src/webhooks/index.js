const express = require('express');
const bodyParser = require('body-parser');
const morganBody = require('morgan-body');
const logger = require('../../config/logger');


const paymentWireCardAction = require('./payment/wirecard');
const deliveryShipEngineAction = require('./delivery/shipengine');

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

app.post("/webhook", async (req, res) => {
    let data, eventType;;
    // Check if webhook signing is configured.
    if (payment.providers.stripe.webhook) {
        const web_hook_secret = payment.providers.stripe.webhook;

        // Retrieve the event by verifying the signature using the raw body and secret.
        let event;
        let signature = req.headers["stripe-signature"];
        try {
            event = stripe.webhooks.constructEvent(
            req.rawBody,
            signature,
            web_hook_secret
            );
        } catch (err) {
            console.log(`⚠️  Webhook signature verification failed.`);
            return res.sendStatus(400);
        }
        data = event.data;
        eventType = event.type;
    } else {
        // Webhook signing is recommended, but if the secret is not configured in `config.js`,
        // we can retrieve the event data directly from the request body.
        data = req.body.data;
        eventType = req.body.type;
    }
  
    if (eventType === "payment_intent.succeeded") {
        // Funds have been captured
        // Fulfill any orders, e-mail receipts, etc
        // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
         console.log("💰 Payment captured!");
    } else if (eventType === "payment_intent.payment_failed") {
        console.log("❌ Payment failed.");
    }
    res.sendStatus(200);
  });

module.exports = app;
