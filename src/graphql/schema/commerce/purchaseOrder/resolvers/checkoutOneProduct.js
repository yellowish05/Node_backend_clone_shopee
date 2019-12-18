const path = require('path');
const checkout = require('../checkoutMethods');

const { payPurchaseOrder } = require(path.resolve('src/bundles/payment'));

module.exports = async function checkoutOneProduct(
  _,
  {
    deliveryRate, product, quantity, currency, paymentMethod,
  },
  { dataSources: { repository }, user },
) {
  const cartItems = await checkout.loadProductAsCart(deliveryRate, product, quantity, repository);

  // creating order
  const order = await checkout.createOrder({
    cartItems, currency, buyerId: user.id,
  }, repository);

  // generate payments with Payment Provider data and update order
  await payPurchaseOrder({ order, paymentMethod, user });

  return order;
};
