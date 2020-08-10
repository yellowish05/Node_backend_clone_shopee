const path = require('path');
const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
const { payment } = require(path.resolve('config'));

module.exports = async (req, res) => {
    let data, eventType;
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
        let customer = data.object.customer;
        console.log("Customer: ", customer);
        let user = await repository.paymentStripeCustomer.getByCustomerID(customer);
        console.log("User: ", user.id);
        await checkout.clearUserCart(user.id, repository);

    } 

    res.sendStatus(200);
};
