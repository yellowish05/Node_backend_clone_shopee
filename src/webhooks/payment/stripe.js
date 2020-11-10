const path = require('path');

const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
const { payment } = require(path.resolve('config'));
const stripe = require('stripe')(payment.providers.stripe.secret);

const { InvoiceService } = require(path.resolve('src/lib/InvoiceService'));

module.exports = async (req, res) => {
  let data; let
    eventType;

  data = req.body.data;
  eventType = req.body.type;

  if (eventType === 'payment_intent.succeeded') {
    // Funds have been captured
    // Fulfill any orders, e-mail receipts, etc
    // To cancel the payment after capture you will need to issue a Refund (https://stripe.com/docs/api/refunds)
    console.log('💰 Payment captured!');
    const { customer } = data.object;
    const buyer = await repository.paymentStripeCustomer.getByCustomerID(customer);
    const cartItems = await repository.userCartItem.getItemsByUser(buyer.user);
    cartItems.map((item) => repository.productInventoryLog.decreaseQuantity(item.product, item.quantity));
    await checkout.clearUserCart(buyer.user, repository);
  } else if (eventType === 'payment_intent.canceled' || eventType === 'payment_intent.payment_failed') {
    const pID = data.object.id;
    const { customer } = data.object;
    await stripe.paymentIntents.cancel(pID)
      .then(async () => {
        const user = await repository.paymentStripeCustomer.getByCustomerID(customer);
        const orderDetails = await InvoiceService.getOrderDetails(pID, user.user);
        const invoicePDF = await InvoiceService.createInvoicePDF(orderDetails);
        await checkout.clearUserCart(user.user, repository);
      }).catch((error) => console.log(error.message));
  }

  const { object } = data;
  if (
    object.object === 'source'
        && object.status === 'chargeable'
        && object.metadata.paymentIntent
  ) {
    const source = object;
    const paymentIntent = await stripe.paymentIntents.retrieve(
      source.metadata.paymentIntent,
    );
    await stripe.paymentIntents.confirm(paymentIntent.id, { source: source.id });
  }

  res.sendStatus(200);
};
