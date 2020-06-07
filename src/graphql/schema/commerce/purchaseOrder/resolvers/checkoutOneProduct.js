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

  const prod = await repository.product.getById(product).then(product => {
    return product.customCarrier;
  })

  if (!prod)
    await payPurchaseOrder({ order, paymentMethod, user });

  return order;
};
