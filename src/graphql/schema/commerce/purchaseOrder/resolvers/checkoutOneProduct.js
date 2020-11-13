const path = require('path');
const { ForbiddenError } = require('apollo-server');
const checkout = require('../checkoutMethods');

const PushNotificationService = require(path.resolve('src/lib/PushNotificationService'));
const { NotificationType, OrderItemStatus } = require(path.resolve('src/lib/Enums'));
const { payPurchaseOrder } = require(path.resolve('src/bundles/payment'));

module.exports = async function checkoutOneProduct(
  _,
  {
    deliveryRate, product, quantity, currency, provider, productAttribute, billingAddress,
  },
  { dataSources: { repository }, user },
) {
  const productAttr = productAttribute ? await repository.productAttributes.getById(productAttribute) : null;
  if (!productAttr && productAttribute) {
    throw new ForbiddenError('Product does not exist.');
  }
  const checkAmount = productAttr
    ? await repository.productAttributes.checkAmountByAttr(productAttribute, quantity)
    : await repository.productInventoryLog.checkAmount(product, quantity);
  const cartItems = productAttr
    ? await checkout.loadProductAsCartByAttr(deliveryRate, product, quantity, repository, productAttribute, billingAddress)
    : await checkout.loadProductAsCart(deliveryRate, product, quantity, repository, billingAddress);
  if (checkAmount) {
    const delivery = await repository.deliveryRateCache.getById(deliveryRate);
    if (!delivery) {
      throw new ForbiddenError('Product\'s delivery information is incorrect.');
    }
    const cartItemData = {
      productId: product,
      quantity,
      productAttribute, // != null ? cartItems[0].productAttribute : null,
      deliveryRateId: delivery.id,
      billingAddress,
    };

    const deliveryrate = await repository.deliveryRate.getById(delivery.id);
    if (!deliveryrate) {
      const cart = await repository.deliveryRate.create(delivery.toObject());
    }

    await repository.userCartItem.add(cartItemData, user.id);

    // creating order
    const order = await checkout.createOrder({
      cartItems, currency, buyerId: user.id,
    }, repository);

    // const prod = await repository.product.getById(product).then((product) => product.customCarrier);

    return payPurchaseOrder({ order, provider, user })
      .then(async (result) => {
        if (result.error) { order.error = result.error; }

        if (result.publishableKey) { order.publishableKey = result.publishableKey; }
        if (result.paymentClientSecret) { order.paymentClientSecret = result.paymentClientSecret; }

        order.deliveryOrders = null;
        return repository.purchaseOrder.update(order);
      })
      .then(async (order) => {
        const productInfo = await repository.product.getById(product);
        // calculate quantity
        if (productAttr) {
          productAttr.quantity -= quantity;
          await productAttr.save();
        } else {
          productInfo.quantity -= quantity;
          await productInfo.save();
        }
        // save notification to buyer
        const seller = await repository.user.getById(productInfo.seller);
        await repository.notification.create({
          type: NotificationType.BUYER_ORDER,
          user: user.id,
          data: {
            content: order.title,
            name: productInfo.title,
            photo: productInfo.assets,
            date: order.createdAt,
            status: OrderItemStatus.CONFIRMED,
            linkID: order.id,
          },
          tags: ['Order:order.id'],
        });
        // save notification to seller
        await repository.notification.create({
          type: NotificationType.SELLER_ORDER,
          user: productInfo.seller,
          data: {
            content: order.title,
            name: productInfo.title,
            photo: productInfo.assets,
            date: order.createdAt,
            status: OrderItemStatus.CONFIRMED,
            linkID: order.id,
          },
          tags: ['Order:order.id'],
        });
        // send push notification to buyer
        if (user.device_id) { await PushNotificationService.sendPushNotification({ message: `You paid your money to buy the product-${productInfo.title}`, device_ids: [user.device_id] }); }
        // send push notification to seller
        if (seller.device_id) { await PushNotificationService.sendPushNotification({ message: `Your product-${productInfo.title} was sold.`, device_ids: [seller.device_id] }); }
        return order;
      });

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

  // const cartItems = await checkout.loadProductAsCart(deliveryRate, product, quantity, repository);
  // creating order
  const order = await checkout.createOrder({
    cartItems, currency, buyerId: user.id,
  }, repository);
  order.error = 'This product is not enough now';
  return order;
};
