const uuid = require('uuid/v4');
const path = require('path');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));
const paymentBundle = require(path.resolve('src/bundles/payment'));
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
        return Promise.all([
          repository.product.getByIds(productIds),
          repository.deliveryRateCache.getByIds(deliveryRateIds),
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
      .then(([product, deliveryRate]) => ([{
        product,
        deliveryRate,
        quantity,
      }]));
  },

  async createOrder({
    cartItems, currency, buyerId,
  }, repository) {
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

    return repository.purchaseOrder.create(order);
  },

  async clearUserCart(userId, repository) {
    return repository.userCartItem.clear(userId);
  },

  async generatePaymentsForOrder(order, repository) {
    const { providers: { WIRECARD } } = paymentBundle;

    const transaction = {
      _id: uuid(),
      buyer: order.buyer,
      merchant: WIRECARD.getMerchantId(),
      createdAt: new Date(),
      type: 'purchase',
      amount: order.total,
      currency: order.currency,
      status: PaymentTransactionStatus.PENDING,
      tags: [order.getTagName()],
    };

    const amountISO = CurrencyFactory.getAmountOfMoney({
      centsAmount: transaction.amount,
      currency: transaction.currency,
    });

    const transactionRequest = WIRECARD.createTransactionRequest({
      date: transaction.createdAt,
      transactionId: transaction._id,
      transactionType: transaction.type,
      currencyAmount: amountISO.getCurrencyAmount(),
      currency: transaction.currency,
    });

    transaction.signature = transactionRequest.getSignature();

    // eslint-disable-next-line no-param-reassign
    order.payments = [transaction._id];

    return Promise.all([
      repository.paymentTransaction.create(transaction),
      order.save(),
    ]);
  },
};
