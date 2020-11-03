const { UserInputError } = require('apollo-server');
const OrderFactory = require('./OrderFactory');

module.exports = {
  async validateDeliveryAddress(id, repository) {
    return repository.deliveryAddress.getById(id)
      .then((address) => {
        if (!address) {
          throw new UserInputError(`Delivery address "${id}" does not exist`, { invalidArgs: ['deliveryAddress'] });
        }

        if (!address.address.isDeliveryAvailable) {
          throw new UserInputError('Delivery address is not valid', { invalidArgs: ['deliveryAddress'] });
        }
      });
  },

  async loadCartAndValidate(userId, repository) {
    return repository.userCartItem.getItemsByUser(userId)
      .then(async (cartItems) => {
        if (!cartItems.length) {
          throw new UserInputError('User Cart is empty');
        }
        const productIds = cartItems.map((item) => item.product).filter((id) => id);
        const deliveryRateIds = cartItems.map((item) => item.deliveryRate).filter((id) => id);
        cartItems.map((item) => {
          if (!repository.productInventoryLog.checkAmount(item.product, item.quantity)) { throw new Error('Invalide to checkout this cart'); }
        });
        return Promise.all([
          repository.product.getByIds(productIds),
          repository.deliveryRate.getByIds(deliveryRateIds),
        ])
          .then(([products, deliveryRates]) => cartItems.map((item) => {
            if (products.length !== deliveryRates.length) {
              throw new UserInputError('Not all cart items have delivery rate');
            }
            // eslint-disable-next-line no-param-reassign
            [item.product] = products.filter((product) => product.id === item.product);
            [item.deliveryRate] = deliveryRates.filter((deliveryRate) => deliveryRate.id === item.deliveryRate);
            return item;
          }));
      });
  },

  async loadProductAsCart(deliveryRateId, productId, quantity, repository) {
    return Promise.all([
      repository.product.getById(productId),
      repository.deliveryRateCache.getById(deliveryRateId),
    ])
      .then(([product, deliveryRate, productAttribute]) => ([{
        product,
        deliveryRate,
        quantity,
      }]));
  },

  async loadProductAsCartByAttr(deliveryRateId, productId, quantity, repository, productAttribute) {
    return Promise.all([
      repository.product.getById(productId),
      repository.deliveryRateCache.getById(deliveryRateId),
    ])
      .then(([product, deliveryRate]) => ([{
        product,
        productAttribute,
        deliveryRate,
        quantity,
      }]));
  },

  async createOrder({
    cartItems, currency, buyerId,
  }, repository) {
    console.log("cartItems => ", cartItems);
    const factory = new OrderFactory(cartItems, currency);

    const orderItems = await factory.createOrderItems()
      .then((items) => Promise.all(
        items.map((item) => repository.orderItem.create(item)),
      ));

    const deliveryOrders = await factory.createDeliveryOrders()
      .then((items) => Promise.all(
        items.map((item, index) => repository.deliveryOrder.create({ ...item, item: orderItems[index].id })),
      ));

    const order = factory.createOrder();
    order.buyer = buyerId;
    order.deliveryOrders = deliveryOrders;
    order.items = orderItems.map((item) => item.id);
    order.isPaid = true;

    // cartItems.map((item) => repository.productInventoryLog.decreaseQuantity(item.product._id, item.quantity));

    return repository.purchaseOrder.create(order);
  },

  async clearUserCart(userId, repository) {
    // return repository.userCartItem.clear(userId);
  },
};
