const checkout = require('../checkoutMethods');

module.exports = async function checkoutCart(
  _,
  { deliveryAddress, currency },
  { dataSources: { repository }, user },
) {
  // validation of input data
  await checkout.validateDeliveryAddress(deliveryAddress, repository);
  const cartItems = await checkout.loadCartAndValidate(user.id, repository);

  // creating order and clean cart
  const order = await checkout.createOrder({
    cartItems, currency, buyerId: user.id, deliveryAddress,
  }, repository);
  await checkout.clearUserCart(user.id, repository);

  // generate payments with Payment Provider data and update order
  await checkout.generatePaymentsForOrder(order, repository);

  return order;
};
