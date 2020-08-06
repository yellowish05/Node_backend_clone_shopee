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
  const checkAmount = await repository.productInventoryLog.checkAmount(product, quantity);
  if (checkAmount) {
    const cartItems = await checkout.loadProductAsCart(deliveryRate, product, quantity, repository);

    // creating order
    const order = await checkout.createOrder({
      cartItems, currency, buyerId: user.id,
    }, repository);

    const prod = await repository.product.getById(product).then((product) => product.customCarrier);

    return payPurchaseOrder({ order, paymentMethod, user })
      .then(async (result) => {
        if(result.error)
          order.error = result.error
        else
          await checkout.clearUserCart(user.id, repository)
        if(result.publishableKey)
          order.publishableKey = result.publishableKey
        if(result.paymentClientSecret)
          order.paymentClientSecret = result.paymentClientSecret

        return order;
      })

    // if (!prod) {
    //   return payPurchaseOrder({ order, paymentMethod, user })
    //   .then(async (result) => {
    //     if(result.error)
    //       order.error = result.error
    //     else
    //       await checkout.clearUserCart(user.id, repository)
    //     if(result.publishableKey)
    //       order.publishableKey = result.publishableKey
    //     if(result.paymentClientSecret)
    //       order.paymentClientSecret = result.paymentClientSecret

    //     return order;
    //   })
    // }

    // return order;
  }
  throw new Error('This product is not enough now');
};
