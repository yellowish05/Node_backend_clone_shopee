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
      items: [CartProductItem]!
      price(currency: Currency!): AmountOfMoney!
      deliveryPrice(currency: Currency!): AmountOfMoney!
      total(currency: Currency!): AmountOfMoney!
    }

    type CartProductItem implements CartItemInterface {
      id: ID!
      quantity: Int!
      metricUnit: ProductMetricUnit
      seller: User!
      total(currency: Currency! = USD): AmountOfMoney!

      product: Product!
      deliveryIncluded: Boolean!
      attr: ProductAttribute
    }

    interface CartItemInterface {
      id: ID!
      quantity: Int!
      metricUnit: ProductMetricUnit
      seller: User!
      total(currency: Currency! = USD): AmountOfMoney!
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
        addProductToCart(product: ID!, deliveryRate: ID, quantity: Int! = 1, metricUnit: ProductMetricUnit, attrId: ID) : Cart! @auth(requires: USER)
        """
            Allows: authorized user
        """
        updateCartItem(id: ID!, deliveryRate: ID, quantity: Int! = 1) : Cart! @auth(requires: USER)
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
    updateCartItem: async (...args) => (
      updateCartItem(...args).then(() => loadCart(...args))
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
      Promise.all(items.map(async ({ quantity, product, metricUnit }) => {
        if (product) {
          let itemCurrency = product.currency;
          let unitPrice = product.price;
          if (metricUnit) {
            let [selectedItem] = product.metrics.filter(metricItem => metricItem.metricUnit === metricUnit);
            itemCurrency = selectedItem.unitPrice.currency;
            unitPrice = selectedItem.unitPrice.amount;
          }
          if (args.currency && args.currency !== itemCurrency) {
            const amountOfMoney = CurrencyFactory.getAmountOfMoney(
              { centsAmount: unitPrice * quantity, currency: itemCurrency },
            );
            return CurrencyService.exchange(amountOfMoney, args.currency)
              .then((exchangedMoney) => exchangedMoney.getCentsAmount());
          }
          // if (args.currency && args.currency !== product.currency) {
          //   const amountOfMoney = CurrencyFactory.getAmountOfMoney(
          //     { centsAmount: product.price * quantity, currency: product.currency },
          //   );
          //   return CurrencyService.exchange(amountOfMoney, args.currency)
          //     .then((exchangedMoney) => exchangedMoney.getCentsAmount());
          // }
          return unitPrice * quantity;
        }
        return 0;
      }))
        .then((itemsSum) => {
          const centsAmount = itemsSum.reduce((total, itemSum) => total + itemSum, 0);
          return CurrencyFactory.getAmountOfMoney({ centsAmount, currency: args.currency });
        })
    ),
    deliveryPrice: async ({ items }, args) => (
      Promise.all(items.map(async ({ deliveryRate }) => {
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
      Promise.all(items.map(async ({ quantity, product, deliveryRate, metricUnit}) => {
        let value = 0;
        if (product) {
          let unitPrice = product.price;
          let itemCurrency = product.currency;
          if (metricUnit) {
            let [selectedItem] = product.metrics.filter(metricItem => metricItem.metricUnit === metricUnit);
            itemCurrency = selectedItem.unitPrice.currency;
            unitPrice = selectedItem.unitPrice.amount;
          }
          if (args.currency && args.currency !== itemCurrency) {
            const amountOfMoney = CurrencyFactory.getAmountOfMoney(
              { centsAmount: unitPrice * quantity, currency: itemCurrency },
            );
            value += await CurrencyService.exchange(amountOfMoney, args.currency)
              .then((exchangedMoney) => exchangedMoney.getCentsAmount());
          } else {
            value += unitPrice * quantity;
          }

          // if (args.currency && args.currency !== product.currency) {
          //   const amountOfMoney = CurrencyFactory.getAmountOfMoney(
          //     { centsAmount: product.price * quantity, currency: product.currency },
          //   );
          //   value += await CurrencyService.exchange(amountOfMoney, args.currency)
          //     .then((exchangedMoney) => exchangedMoney.getCentsAmount());
          // } else {
          //   value += product.price * quantity;
          // }
        }
        if (deliveryRate) {
          if (args.currency && args.currency !== deliveryRate.currency) {
            const amountOfMoney = CurrencyFactory.getAmountOfMoney(
              { centsAmount: deliveryRate.amount, currency: deliveryRate.currency },
            );
            value += await CurrencyService.exchange(amountOfMoney, args.currency)
              .then((exchangedMoney) => exchangedMoney.getCentsAmount());
          } else {
            value += deliveryRate.amount;
          }
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
    total: async ({ quantity, product, deliveryRate, metricUnit }, { currency }) => {
      let productTotal = product.price * quantity;
      let itemCurrency = product.currency;
      let deliveryTotal = deliveryRate ? deliveryRate.amount : 0;

      if (metricUnit && product.metrics && product.metrics.length) {
        let [selectedItem] = product.metrics.filter(metricItem => metricItem.metricUnit === metricUnit);
        if (!selectedItem) {
          throw new UserInputError(`Product with id "${product._id}" does not have metric unit ${metricUnit}!`, { invalidArgs: [product] });
        }
        productTotal = selectedItem.unitPrice.amount * quantity;
        itemCurrency = selectedItem.unitPrice.currency;
      }

      // if (currency !== product.currency) {
      //   const amountOfMoney = CurrencyFactory.getAmountOfMoney({
      //     centsAmount: productTotal, currency: product.currency,
      //   });
      //   productTotal = await CurrencyService.exchange(amountOfMoney, currency)
      //     .then((exchangedMoney) => exchangedMoney.getCentsAmount());
      // }
      if (currency !== itemCurrency) {
        const amountOfMoney = CurrencyFactory.getAmountOfMoney({
          centsAmount: productTotal, currency: itemCurrency,
        });
        productTotal = await CurrencyService.exchange(amountOfMoney, currency)
          .then((exchangedMoney) => exchangedMoney.getCentsAmount());
      }

      if (deliveryRate && currency !== deliveryRate.currency) {
        const amountOfMoney = CurrencyFactory.getAmountOfMoney({
          centsAmount: deliveryRate.amount, currency: deliveryRate.currency,
        });
        deliveryTotal = await CurrencyService.exchange(amountOfMoney, currency)
          .then((exchangedMoney) => exchangedMoney.getCentsAmount());
      }

      return CurrencyFactory.getAmountOfMoney({
        centsAmount: productTotal + deliveryTotal, currency,
      });
    },
    seller: async ({ user }, _, { dataSources: { repository }}) => {
      return repository.user.getById(user);
    },
    deliveryIncluded: ({ deliveryRate }) => deliveryRate != null && typeof deliveryRate !== 'undefined',
    product: async (cartItem, _, { dataSources: { repository } }) => repository.product.getById(cartItem.product),
    attr: async ({ attrId }, _, { dataSources: { repository }}) => repository.productAttributes.getById(attrId),
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
