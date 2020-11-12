const path = require('path');
const express = require('express');

const app = express();
const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
// const { payment } = require(path.resolve('config'));
// const { InvoiceService } = require(path.resolve('src/lib/InvoiceService'));

module.exports = async (req, res) => {
  const { event } = req.body;
  const payment = req.body.payload.payment.entity;

  if (event === 'payment.captured') {
    console.log('💰 Payment captured!');

    const { email } = payment;
    const user = await repository.user.findByEmail(email);
    const cartItems = await repository.userCartItem.getItemsByUser(user.id);
    cartItems.map((item) => repository.productInventoryLog.decreaseQuantity(item.product, item.quantity));

    await checkout.clearUserCart(user.id, repository);

    let paymentInfo = '';
    switch (payment.method) {
      case 'netbanking':
        paymentInfo = `Bank Account - ${payment.bank}`;
        break;
      case 'card':
        paymentInfo = `${payment.card.network} Card Ending in ${payment.card.last4}`;
        break;
      case 'wallet':
        paymentInfo = `Wallet - ${payment.wallet}`;
        break;
      case 'upi':
        paymentInfo = `UPI - ${payment.vpa}`;
        break;

      default:
        break;
    }

    await repository.purchaseOrder.addPaymentInfo(payment.order_id, paymentInfo);
  } else if (event === 'payment.failed') {
    const pID = payment.id;
  }

  res.sendStatus(200);
};
