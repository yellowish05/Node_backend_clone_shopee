const checkout = require('../checkoutMethods');

module.exports = async function checkoutCart(
  _,
  {
    deliveryAddress, product, quantity, currency,
  },
  { dataSources: { repository }, user },
) {
  // validation of input data
  await checkout.validateDeliveryAddress(deliveryAddress, repository);
  const cartItems = await checkout.loadProductAsCart(product, quantity, repository);

  // creating order
  const order = await checkout.createOrder({
    cartItems, currency, buyerId: user.id, deliveryAddress,
  }, repository);

  // generate payments with Payment Provider data and update order
  await checkout.generatePaymentsForOrder(order, repository);

  return order;
};
