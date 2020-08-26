const path = require('path');
const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
const { payment } = require(path.resolve('config'));

module.exports = async (req, res) => {
    let data, eventType;

    data = req.body.data;
    eventType = req.body.type;

    if(eventType == "payment_intent.created") {
        console.log(data.object);
    }

    if (eventType === "payment_intent.succeeded") {
        // Funds have been captured
        // Fulfill any orders, e-mail receipts, etc
        // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
        console.log("💰 Payment captured!");
        let customer = data.object.customer;
        let buyer = await repository.paymentStripeCustomer.getByCustomerID(customer);
        let cartItems = await repository.userCartItem.getItemsByUser(buyer.user);
        cartItems.map((item) => repository.productInventoryLog.decreaseQuantity(item.product, item.quantity));
        await checkout.clearUserCart(buyer.user, repository);
        "payment_method_details": {
            "card": {
              "brand": "visa",
              "checks": {
                "address_line1_check": null,
                "address_postal_code_check": null,
                "cvc_check": null
              },
              "country": "US",
              "exp_month": 8,
              "exp_year": 2021,
              "fingerprint": "pfb0FE2I7CUlQbY6",
              "funding": "credit",
              "installments": null,
              "last4": "4242",
              "network": "visa",
              "three_d_secure": null,
              "wallet": null
            },

        const card_details = data.object.charges.data[0].payment_method_details.card
    } 

    res.sendStatus(200);
};
