/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');

const addProductToCart = require('./resolvers/addProductToCart');
const deleteCartItem = require('./resolvers/deleteCartItem');
const updateCartItem = require('./resolvers/updateCartItem');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));

const schema = gql`
    type Cart {
      items: [CartItemInterface]!
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
        addProductToCart(product: ID!, quantity: Int! = 1) : Cart! @auth(requires: USER)
        """
            Allows: authorized user
        """
        deleteCartItem(id: ID!) : Cart! @auth(requires: USER)
        """
            Allows: authorized user
        """
        updateCartItem(id: ID!, quantity: Int!) : Cart! @auth(requires: USER)
        """
            Allows: authorized user
        """
        clearCart : Cart! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    cart: async (_, args, { dataSources: { repository }, user }) => repository.userCartItem
      .getAll({ user: user.id })
      .then((items) => {
        const productIds = items.map((item) => item.product).filter((id) => id !== null);

        return repository.product.findByIds(productIds)
          .then((products) => {
            const productsById = products.reduce((accumulator, product) => {
              accumulator[product.id] = product;
              return accumulator;
            }, {});

            return items.map((item) => {
              if (item.product && productsById[item.product]) {
                item.product = productsById[item.product];
              }
              return item;
            });
          })
          .then((itemsWithProducts) => ({ items: itemsWithProducts }));
      }),
  },
  Mutation: {
    addProductToCart,
    deleteCartItem,
    updateCartItem,
    clearCart: (obj, args, { dataSources: { repository }, user }) => repository.userCartItem.clear(user.id),
  },
  Cart: {
    total: async ({ items }, args) => (
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
