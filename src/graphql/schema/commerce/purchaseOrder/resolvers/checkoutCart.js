const checkout = require('../checkoutMethods');

module.exports = async function checkoutCart(
  _,
  { currency },
  { dataSources: { repository }, user },
) {
  const cartItems = await checkout.loadCartAndValidate(user.id, repository);

  // creating order and clean cart
  const order = await checkout.createOrder({
    cartItems, currency, buyerId: user.id,
  }, repository);
  await checkout.clearUserCart(user.id, repository);

  // generate payments with Payment Provider data and update order
  await checkout.generatePaymentsForOrder(order, repository);

  return order;
};
