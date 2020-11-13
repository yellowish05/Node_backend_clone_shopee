const path = require('path');
const checkout = require('../checkoutMethods');

const { payPurchaseOrder } = require(path.resolve('src/bundles/payment'));

module.exports = async function checkoutCart(
  _,
  { currency, provider },
  { dataSources: { repository }, user },
) {
  const cartItems = await checkout.loadCartAndValidate(user.id, repository);

  // creating order and clean cart
  const order = await checkout.createOrder({
    cartItems, currency, buyerId: user.id,
  }, repository);
  // await checkout.clearUserCart(user.id, repository);

  // generate payments with Payment Provider data and update order
  return payPurchaseOrder({ order, provider, user })
  .then(async (result) => {
    if(result.error)
      order.error = result.error
    
    if(result.publishableKey)
      order.publishableKey = result.publishableKey
    if(result.paymentClientSecret)
      order.paymentClientSecret = result.paymentClientSecret

    return order;
  })
  // return order;
};
