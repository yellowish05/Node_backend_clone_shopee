/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');

const addProductToCart = require('./resolvers/addProductToCart');
const deleteCartItem = require('./resolvers/deleteCartItem');
const updateCartItem = require('./resolvers/updateCartItem');
const loadCart = require('./resolvers/loadCart');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));

const schema = gql`
    type Cart {
      items: [CartItemInterface]!
      price(currency: Currency!): AmountOfMoney!
      deliveryPrice(currency: Currency!): AmountOfMoney!
      total(currency: Currency!): AmountOfMoney!
    }

    type CartProductItem implements CartItemInterface {
      id: ID!
      quantity: Int!
      seller: User!
      total(currency: Currency): AmountOfMoney!

      product: Product!
    }

    interface CartItemInterface {
      id: ID!
      quantity: Int!
      seller: User!
      total(currency: Currency): AmountOfMoney!
    }

    extend type Query {
        """
            Allows: authorized user
        """
        cart: Cart! @auth(requires: USER)
    }

    extend type Mutation {
        """
            Allows: authorized user
        """
        addProductToCart(product: ID!, deliveryRate: ID!, quantity: Int! = 1) : Cart! @auth(requires: USER)
        """
            Allows: authorized user
        """
        deleteCartItem(id: ID!) : Cart! @auth(requires: USER)
        """
            Allows: authorized user
        """
        clearCart : Cart! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    cart: loadCart,
  },
  Mutation: {
    addProductToCart: async (...args) => (
      addProductToCart(...args).then(() => loadCart(...args))
    ),
    deleteCartItem: async (...args) => (
      deleteCartItem(...args).then(() => loadCart(...args))
    ),
    clearCart: async (...args) => {
      const [,, { dataSources: { repository }, user }] = args;
      return repository.userCartItem.clear(user.id)
        .then(() => loadCart(...args));
    },
  },
  Cart: {
    price: async ({ items }, args) => (
      Promise.all(items.map(async ({ quantity, product }) => {
        if (product) {
          if (args.currency && args.currency !== product.currency) {
            const amountOfMoney = CurrencyFactory.getAmountOfMoney(
              { centsAmount: product.price * quantity, currency: product.currency },
            );
            return CurrencyService.exchange(amountOfMoney, args.currency)
              .then((exchangedMoney) => exchangedMoney.getCentsAmount());
          }
          return product.price * quantity;
        }
        return 0;
      }))
        .then((itemsSum) => {
          const centsAmount = itemsSum.reduce((total, itemSum) => total + itemSum, 0);
          return CurrencyFactory.getAmountOfMoney({ centsAmount, currency: args.currency });
        })
    ),
    deliveryPrice: async ({ items }, args) => (
      Promise.all(items.map(async ({ product, deliveryRate }) => {
        if (deliveryRate) {
          if (args.currency && args.currency !== deliveryRate.currency) {
            const amountOfMoney = CurrencyFactory.getAmountOfMoney(
              { centsAmount: deliveryRate.amount, currency: deliveryRate.currency },
            );
            return CurrencyService.exchange(amountOfMoney, args.currency)
              .then((exchangedMoney) => exchangedMoney.getCentsAmount());
          }
          return deliveryRate.amount;
        }
        return 0;
      }))
        .then((itemsSum) => {
          const centsAmount = itemsSum.reduce((total, itemSum) => total + itemSum, 0);
          return CurrencyFactory.getAmountOfMoney({ centsAmount, currency: args.currency });
        })
    ),
    total: async ({ items }, args) => (
      Promise.all(items.map(async ({ quantity, product, deliveryRate }) => {
        let value = 0;
        if (product) {
          if (args.currency && args.currency !== product.currency) {
            const amountOfMoney = CurrencyFactory.getAmountOfMoney(
              { centsAmount: product.price * quantity, currency: product.currency },
            );
            value += await CurrencyService.exchange(amountOfMoney, args.currency)
              .then((exchangedMoney) => exchangedMoney.getCentsAmount());
          }
          value += product.price * quantity;
        }
        if (deliveryRate) {
          if (args.currency && args.currency !== deliveryRate.currency) {
            const amountOfMoney = CurrencyFactory.getAmountOfMoney(
              { centsAmount: deliveryRate.amount, currency: deliveryRate.currency },
            );
            return CurrencyService.exchange(amountOfMoney, args.currency)
              .then((exchangedMoney) => exchangedMoney.getCentsAmount());
          }
          value += deliveryRate.amount;
        }
        return value;
      }))
        .then((itemsSum) => {
          const centsAmount = itemsSum.reduce((total, itemSum) => total + itemSum, 0);
          return CurrencyFactory.getAmountOfMoney({ centsAmount, currency: args.currency });
        })
    ),
  },
  CartProductItem: {
    total: async ({ quantity, product: { price, currency } }, args) => {
      const centsAmount = price * quantity;
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount, currency });

      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
  },
  CartItemInterface: {
    __resolveType(cartItem) {
      if (cartItem.product) {
        return 'CartProductItem';
      }

      return null;
    },
  },
};
