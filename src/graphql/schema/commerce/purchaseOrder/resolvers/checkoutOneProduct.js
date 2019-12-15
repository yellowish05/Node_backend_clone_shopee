const checkout = require('../checkoutMethods');

module.exports = async function checkoutCart(
  _,
  {
    deliveryRate, product, quantity, currency,
  },
  { dataSources: { repository }, user },
) {
  const cartItems = await checkout.loadProductAsCart(deliveryRate, product, quantity, repository);

  // creating order
  const order = await checkout.createOrder({
    cartItems, currency, buyerId: user.id,
  }, repository);

  // generate payments with Payment Provider data and update order
  await checkout.generatePaymentsForOrder(order, repository);

  return order;
};
