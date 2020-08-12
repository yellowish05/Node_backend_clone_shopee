const path = require('path');
const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
const { payment } = require(path.resolve('config'));

module.exports = async (req, res) => {
    let data, eventType;

    data = req.body.data;
    eventType = req.body.type;

    if (eventType === "payment_intent.created") {
        // Funds have been captured
        // Fulfill any orders, e-mail receipts, etc
        // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
        console.log("💰 Payment captured!");
        let customer = data.object.customer;
        let buyer = await repository.paymentStripeCustomer.getByCustomerID(customer);
        let cartItems = await repository.userCartItem.getItemsByUser(buyer.user);
        cartItems.map((item) => repository.productInventoryLog.decreaseQuantity(item.product, item.quantity));
        await checkout.clearUserCart(buyer.user, repository);
    } 

    res.sendStatus(200);
};
