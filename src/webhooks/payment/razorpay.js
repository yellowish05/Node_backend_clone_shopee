const path = require('path');
const express = require('express');

const app = express();
const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
const { payment } = require(path.resolve('config'));
const { InvoiceService } = require(path.resolve('src/lib/InvoiceService'));

module.exports = async (req, res) => {
  const { event } = req.body;
  const payment = req.body.payload.payment.entity;

  if (event === 'payment.captured') {
    console.log('💰 Payment captured!');
    console.log(payment);
    // const card = payment.card
    const { email } = payment;
    const user = await repository.user.findByEmail(email);
    const cartItems = await repository.userCartItem.getItemsByUser(user.id);
    cartItems.map((item) => repository.productInventoryLog.decreaseQuantity(item.product, item.quantity));
    // const orderDetails = await InvoiceService.getOrderDetails(payment.id, user.id);
    // const invoicePDF = await InvoiceService.createInvoicePDF(orderDetails);
    await checkout.clearUserCart(user.id, repository);
  } else if (event === 'payment.failed') {
    const pID = payment.id;
    console.log(pID);
  }

  res.sendStatus(200);
};
