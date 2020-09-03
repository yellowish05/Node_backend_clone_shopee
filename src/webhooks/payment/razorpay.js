const path = require('path');
const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const checkout = require(path.resolve('src/graphql/schema/commerce/purchaseOrder/checkoutMethods'));
const { payment } = require(path.resolve('config'));
const stripe = require("stripe")(payment.providers.stripe.secret);

const razorNode = require("razornode").razorNode;
const instance  = new razorNode(process.env.PAYMENT_RAZORPAY_KEY_ID, process.env.PAYMENT_RAZORPAY_KEY_SECRET);


module.exports = async (req, res) => {
  await hooks.on("captured", async (evt) => {
    const rawData = evt.rawData
    const payment = evt.payment

    console.log("new payment is successfully captured", payment)

    const email = payment.payload.payment.entity.email
    const phone = payment.payload.payment.entity.contact
    const user = await repository.user.getByContact({ email, phone })
    const cartItems = await repository.userCartItem.getItemsByUser(user.id)
    cartItems.map((item) => repository.productInventoryLog.decreaseQuantity(item.product, item.quantity));
    await checkout.clearUserCart(user.id, repository);

  })
  res.sendStatus(200);
};