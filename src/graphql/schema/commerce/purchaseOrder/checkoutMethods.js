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
        return repository.product.getByIds(productIds)
          .then((products) => cartItems.map((item) => {
            // eslint-disable-next-line no-param-reassign
            [item.product] = products.filter((product) => product.id === item.product);
            return item;
          }));
      });
  },

  async loadProductAsCart(productId, quantity, repository) {
    return repository.product.getById(productId)
      .then((product) => ([{
        product,
        quantity,
      }]));
  },

  async createOrder({
    cartItems, currency, buyerId, deliveryAddress,
  }, repository) {
    const factory = new OrderFactory(cartItems, currency);

    const orderItems = await factory.createOrderItems()
      .then((items) => Promise.all(
        items.map((item) => repository.orderItem.create(item)),
      ));

    const order = factory.createOrder();
    order.buyer = buyerId;
    order.deliveryAddress = deliveryAddress;
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
