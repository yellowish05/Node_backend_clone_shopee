const path = require('path');

const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
const { payment } = require(path.resolve('config'));
const stripe = require('stripe')(payment.providers.stripe.secret);

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

    const pid = data.object.id;
    const paymentIntent = await stripe.paymentIntents.retrieve(pid);
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentIntent.payment_method);
    let paymentInfo = '';

    switch (paymentMethod.type) {
      case 'card':
        paymentInfo = `${paymentMethod.card.brand.toUpperCase()} Card Ending in ${paymentMethod.card.last4}`;
        break;
      case 'alipay':
        paymentInfo = 'Alipay Payment Method';
        break;
      case 'au_becs_debit':
        paymentInfo = `Bank Account Ending in ${paymentMethod.au_becs_debit.last4}`;
        break;
      case 'bacs_debit':
        paymentInfo = `Bacs Direct Debit Bank Account Ending in ${paymentMethod.bacs_debit.last4}`;
        break;
      case 'bancontact':
        paymentInfo = 'Bancontact Payment Method';
        break;
      case 'eps':
        paymentInfo = 'EPS Payment Method';
        break;
      case 'fpx':
        paymentInfo = 'FPX Payment Method';
        break;
      case 'giropay':
        paymentInfo = 'Giropay payment method';
        break;
      case 'ideal':
        paymentInfo = 'iDEAL Payment Method';
        break;
      case 'interac_present':
        paymentInfo = 'Interac Present Payment Method';
        break;
      case 'oxxo':
        paymentInfo = 'OXXO Payment Method';
        break;
      case 'p24':
        paymentInfo = 'P24 Payment Method';
        break;
      case 'sepa_debit':
        paymentInfo = `SEPA Debit Bank Account Ending in ${paymentMethod.sepa_debit.last4}`;
        break;
      case 'sofort ':
        paymentInfo = 'SOFORT Payment Method';
        break;
      default:
        break;
    }

    await repository.purchaseOrder.addPaymentInfo(paymentIntent.client_secret, paymentInfo);
  } else if (eventType === 'payment_intent.canceled' || eventType === 'payment_intent.payment_failed') {
    const pID = data.object.id;
    const { customer } = data.object;
    await stripe.paymentIntents.cancel(pID)
      .then(async () => {
        const user = await repository.paymentStripeCustomer.getByCustomerID(customer);
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
