const path = require('path');
const checkout = require('../checkoutMethods');

const { payPurchaseOrder } = require(path.resolve('src/bundles/payment'));

module.exports = async function checkoutCart(
  _,
  { currency, paymentMethod },
  { dataSources: { repository }, user },
) {
  const cartItems = await checkout.loadCartAndValidate(user.id, repository);

  // creating order and clean cart
  const order = await checkout.createOrder({
    cartItems, currency, buyerId: user.id,
  }, repository);
  await checkout.clearUserCart(user.id, repository);

  // generate payments with Payment Provider data and update order
  await payPurchaseOrder({ order, paymentMethod, user });
  cartItems.map((item) => {
    repository.productInventoryLog.decreaseQuantity(item.product._id, item.quantity);
  });
  return order;
};
