const path = require('path');
const { ForbiddenError } = require('apollo-server');
const checkout = require('../checkoutMethods');

const { payPurchaseOrder } = require(path.resolve('src/bundles/payment'));
const PushNotificationService = require(path.resolve('src/lib/PushNotificationService'));
const { NotificationType, OrderItemStatus, PaymentMethodProviders } = require(path.resolve('src/lib/Enums'));

module.exports = async function checkoutCart(
  _,
  { currency, provider, redirection },
  { dataSources: { repository }, user },
) {
  let cartItems = await checkout.loadCartAndValidate(user.id, repository);
  cartItems = cartItems.filter(item => item.selected);
  if (!cartItems.length) throw new ForbiddenError("Please select items to checkout!");

  // creating order and clean cart
  const order = await checkout.createOrder({
    cartItems, currency, buyerId: user.id,
  }, repository);

  // await checkout.clearUserCart(user.id, repository);

  // generate payments with Payment Provider data and update order
  return payPurchaseOrder({ order, provider, redirection, user })
    .then(async (result) => {
      if (result.error) { order.error = result.error; }

      if (result.publishableKey) { order.publishableKey = result.publishableKey; }
      if (result.paymentClientSecret) { order.paymentClientSecret = result.paymentClientSecret; }

      order.deliveryOrders = null;
      order.isPaid = [PaymentMethodProviders.PAYPAL].includes(provider) ? false : true;
      return repository.purchaseOrder.update(order);
    })
    .then(async (order) => {
      // if (!order.error) {
      //   cartItems.map(async (item) => {
      //     const { product, quantity } = item;
      //     const productInfo = await repository.product.getById(product);
      //     const seller = await repository.user.getById(productInfo.seller);
      //     // update sold count of product.
      //     productInfo.sold += quantity;
      //     await productInfo.save();
      //     // save notification to seller
      //     await repository.notification.create({
      //       type: NotificationType.SELLER_ORDER,
      //       user: productInfo.seller,
      //       data: {
      //         content: order.title, //biwu? no title in model.
      //         name: productInfo.title,
      //         photo: productInfo.assets,
      //         date: order.createdAt,
      //         status: OrderItemStatus.CONFIRMED,
      //         linkID: order.id,
      //       },
      //       tags: [`Order:${order.id}`],
      //     });
      //     // send push notification to seller
      //     if (seller.device_id) { await PushNotificationService.sendPushNotification({ message: `Your product-${productInfo.title} was sold.`, device_ids: [seller.device_id] }); }
      //   });
      //   // save notification to buyer
      //   await repository.notification.create({
      //     type: NotificationType.BUYER_ORDER,
      //     user: user.id,
      //     data: {
      //       content: order.title,
      //       name: order.title,
      //       photo: null,
      //       date: order.createdAt,
      //       status: OrderItemStatus.CONFIRMED,
      //       linkID: order.id,
      //     },
      //     tags: ['Order:order.id'],
      //   });
      //   // send push notification to buyer
      //   if (user.device_id) { await PushNotificationService.sendPushNotification({ message: 'You paid your money to buy the products of your cart', device_ids: [user.device_id] }); }
      // }
      return order;
    })
    // .catch(e => {
    //   console.log('[Checkout error]', e);
    //   return null;
    // });

};
