/* eslint-disable no-param-reassign */
const path = require('path');
const { gql } = require('apollo-server');

const addProductToCart = require('./resolvers/addProductToCart');
const deleteCartItem = require('./resolvers/deleteCartItem');
const updateCartItem = require('./resolvers/updateCartItem');
const loadCart = require('./resolvers/loadCart');
const selectCartItems = require('./resolvers/selectCartItems');
const updateCartItemDeliveryRate = require('./resolvers/updateCartItemDeliveryRate');
const updateCartItemBillingAddress = require('./resolvers/updateCartItemBillingAddress');
const addDiscountCodeToCart = require('./resolvers/addDiscountCodeToCart');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { getDeliveryPrice } = require('./cartMethods');

const { DiscountValueType, DiscountPrivileges, ShippingRuleType } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    type Cart {
      items: [CartProductItem]!
      price(currency: Currency!): AmountOfMoney!
      deliveryPrice(currency: Currency!): AmountOfMoney!
      discountPrice(currency: Currency!): AmountOfMoney!
      total(currency: Currency!): AmountOfMoney!
      
    }

    type CartProductItem implements CartItemInterface {
      id: ID!
      quantity: Int!
      metricUnit: ProductMetricUnit
      seller: User!
      total(currency: Currency! = USD): AmountOfMoney!
      productAttribute: ProductAttribute
      discount:Discount
      product: Product!
      deliveryIncluded: Boolean!
      deliveryAddress: DeliveryAddress
      billingAddress: DeliveryAddress
      note: String
      selected: Boolean
    }

    interface CartItemInterface {
      id: ID!
      quantity: Int!
      metricUnit: ProductMetricUnit
      seller: User!
      productAttribute: ProductAttribute
      total(currency: Currency! = USD): AmountOfMoney!
      note: String
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
        addProductToCart(
          product: ID!, 
          deliveryRate: ID, 
          quantity: Int! = 1,
          billingAddress: ID
          productAttribute: ID, 
          metricUnit: ProductMetricUnit, 
          note: String
        ) : Cart! @auth(requires: USER)
        """
            Allows: authorized user
        """
        updateCartItem(id: ID!, deliveryRate: ID, quantity: Int! = 1, billingAddress: ID, note: String) : Cart! @auth(requires: USER)
        """
            Allows: authorized user
        """
        deleteCartItem(id: ID!) : Cart! @auth(requires: USER)
        """
            Allows: authorized user
        """
        clearCart(selected: Boolean, language: LanguageList, currency: Currency) : Cart! @auth(requires: USER)
        selectCartItems(ids: [ID]!, selected: Boolean = true): Cart! @auth(requires: USER)
        addDiscountCodeToCart(discountCode: String!): Cart! @auth(requires: USER)
        updateCartItemDeliveryRate(id: ID!, deliveryRate: ID!): CartProductItem! @auth(requires: USER)
        updateCartItemBillingAddress(ids: [ID!], billingAddress: ID!): [CartProductItem!] @auth(requires: USER)
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
      const [, { selected }, { dataSources: { repository }, user }] = args;
      return repository.userCartItem.clear(user.id, selected)
        .then(() => loadCart(...args));
    },
    selectCartItems,
    updateCartItemDeliveryRate,
    updateCartItemBillingAddress,
    addDiscountCodeToCart,
  },
  Cart: {
    price: async ({ items }, args) => (
      Promise.all(items.map(async ({
        quantity, product, metricUnit, productAttribute,
      }) => {
        if (!product && !productAttribute) { return 0; }

        const amountOfMoney = CurrencyFactory.getAmountOfMoney({
          centsAmount: productAttribute ? productAttribute.price * quantity : product.price * quantity,
          currency: productAttribute ? productAttribute.currency : product.currency,
        });

        if (productAttribute) {
          if (args.currency && args.currency !== productAttribute.currency) {
            const amountOfMoney = CurrencyFactory.getAmountOfMoney(
              { centsAmount: productAttribute.price * quantity, currency: productAttribute.currency },
            );
            return CurrencyService.exchange(amountOfMoney, args.currency)
              .then((exchangedMoney) => exchangedMoney.getCentsAmount());
          }
          return amountOfMoney.getCentsAmount();
        }

        if (product) {
          let itemCurrency = product.currency;
          let unitPrice = product.price;
          if (metricUnit) {
            const [selectedItem] = product.metrics.filter((metricItem) => metricItem.metricUnit === metricUnit);
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
    deliveryPrice: getDeliveryPrice,
    discountPrice: async ({ items }, args, { user, dataSources: { repository } }) => Promise.all(items.map(async ({
      discountAmount,
    }) => {
      if (args.currency && args.currency) {
        const amountOfMoney = CurrencyFactory.getAmountOfMoney(
          { centsAmount: discountAmount, currency: 'USD' },
        );
        return CurrencyService.exchange(amountOfMoney, args.currency)
          .then((exchangedMoney) => {
            const temp = exchangedMoney.getCentsAmount();
            return temp;
          });
      }
      return discountAmount;
    }))
      .then((itemsSum) => {
        console.log({ itemsSum });
        const centsAmount = itemsSum.reduce((total, itemSum) => total + itemSum, 0);
        console.log({ centsAmount });
        return CurrencyFactory.getAmountOfMoney({ centsAmount, currency: args.currency });
      }),
    total: async ({ items }, args) => (
      Promise.all(items.map(async ({
        quantity, product, productAttribute, deliveryRate, metricUnit, discountAmount,
      }) => {
        let value = 0;
        const entity = productAttribute || product;
        const amountOfMoney = CurrencyFactory.getAmountOfMoney(
          { centsAmount: entity.price * quantity, currency: entity.currency },
        );

        if (args.currency && args.currency !== entity.currency) {
          value += await CurrencyService.exchange(amountOfMoney, args.currency)
            .then((exchangedMoney) => exchangedMoney.getCentsAmount());
        } else {
          value += amountOfMoney.getCentsAmount();
        }

        return value;
      }))
        .then(async (itemsSum) => {
          const centsAmount = itemsSum.reduce((total, itemSum) => total + itemSum, 0);
          const deliveryPrice = await getDeliveryPrice({ items }, args);
          return CurrencyFactory.getAmountOfMoney({
            centsAmount: centsAmount + deliveryPrice.getCentsAmount(),
            currency: args.currency,
          });
        })
    ),
  },
  CartProductItem: {
    total: async ({
      quantity, product, deliveryRate, metricUnit, shippingRule,
    }, { currency }) => {
      let productTotal = product.price * quantity;
      let deliveryTotal = deliveryRate && shippingRule === ShippingRuleType.SIMPLE ? deliveryRate.amount * quantity : 0;
      let itemCurrency = product.currency;

      if (metricUnit && product.metrics && product.metrics.length) {
        const [selectedItem] = product.metrics.filter((metricItem) => metricItem.metricUnit === metricUnit);
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

      if (deliveryTotal > 0 && currency !== deliveryRate.currency) {
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
    seller: async ({ product }, _, { dataSources: { repository } }) => repository.product.getById(product).then((product) => repository.user.getById(product.seller)),
    deliveryIncluded: ({ deliveryRate, shippingRule }, _, { dataSources: { repository } }) => {
      const defaultValue = deliveryRate != null && typeof deliveryRate !== 'undefined';
      if (shippingRule === ShippingRuleType.ADVANCED) {
        return false;
      }
      return defaultValue;
    },
    deliveryAddress: async ({ deliveryRate: rateId }, _, { dataSources: { repository } }) => {
      if (!rateId) return null;
      return repository.deliveryRate.getById(rateId)
        .then((deliveryRate) => repository.deliveryAddress.getById(deliveryRate.deliveryAddress));
    },
    discount: async ({ discount }, _, { dataSources: { repository } }) => {
      if (!discount) return null;
      return repository.discount.getById(discount);
    },
    billingAddress: ({ billingAddress }, _, { dataSources: { repository } }) => repository.billingAddress.getById(billingAddress),
    product: async (cartItem, _, { dataSources: { repository } }) => repository.product.getById(cartItem.product),
    productAttribute: async (cartItem, _, { dataSources: { repository } }) => repository.productAttributes.getById(cartItem.productAttribute),
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
