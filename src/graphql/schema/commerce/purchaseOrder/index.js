const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const checkoutCart = require('./resolvers/checkoutCart');
const checkoutOneProduct = require('./resolvers/checkoutOneProduct');
const payPurchaseOrder = require('./resolvers/payPurchaseOrder');
const { PaymentMethodProviders } = require(path.resolve('src/lib/Enums'));
const { PurchaseOrderStatus } = require(path.resolve('src/lib/Enums'));
const LinePayConfirm  = require(path.resolve('src/bundles/payment/providers/LinePay/LinePayConfirm'));

const schema = gql`
    enum PurchaseOrderStatus {
        ${PurchaseOrderStatus.toGQL()}
    }

    enum PaymentMethodProviders {
      ${PaymentMethodProviders.toGQL()}
    }

    """ Orders for Buyer """
    type PurchaseOrder {
        id: ID!
        isPaid: Boolean!
        """ Collected status """
        status: PurchaseOrderStatus!
        """ List of products or services or anything else what we going to selling """
        items: [OrderItemInterface!]!
        """ In Cents, Amount of money Shoclef will charge from Buyer"""
        price: AmountOfMoney!
        """ In Cents, Amount of money Shoclef will charge from Buyer"""
        deliveryPrice: AmountOfMoney!
        """ In Cents, Amount of money Shoclef will charge from Buyer"""
        total: AmountOfMoney!
        """ In future buyer will be able to pay by few paymnets to one Order"""
        payments: [PaymentTransactionInterface!]
        """ Address for ship products """
        deliveryOrders: [DeliveryOrder]!
        cancelationReason: String
        error: String
        publishableKey: String
        paymentClientSecret: String
    }

    type PurchaseOrderCollection {
        collection: [PurchaseOrder]!
        pager: Pager
    }

    type ConfirmMessage {
      message: String!
    }

    input PurchaseOrderFilterInput {
        statuses: [PurchaseOrderStatus!]
    }

    extend type Query {
        purchaseOrders(filter: PurchaseOrderFilterInput, page: PageInput = {}): PurchaseOrderCollection!  @auth(requires: USER)
        purchaseOrder(id: ID!): PurchaseOrder  @auth(requires: USER)
    }

    extend type Mutation {
        """Allows: authorized user"""
        checkoutCart(currency: Currency!, provider: PaymentMethodProviders!): PurchaseOrder! @auth(requires: USER)

        """Allows: authorized user"""
        checkoutOneProduct(deliveryRate: ID!, product: ID!, quantity: Int!, currency: Currency!, provider: PaymentMethodProviders!): PurchaseOrder! @auth(requires: USER)

        """Allows: authorized user"""
        cancelPurchaseOrder(id: ID!, reason: String!): PurchaseOrder! @auth(requires: USER)

        """Allows: authorized user"""
        LinePayConfirm(transactionID: String!, amount: Float!, currency: Currency!): ConfirmMessage! @auth(requires: USER)

        """
        Allows: authorized user
        Pass ID of the Order you want to pay
        """
        payPurchaseOrder(id: ID!, paymentMethod: ID): PaymentTransactionInterface! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    purchaseOrders: async (_, { page }, { dataSources: { repository }, user }) => (
      repository.purchaseOrder.find({ user })
        .then((collection) => ({
          collection: collection || [],
          pager: {
            ...page,
            total: 0,
          },
        }))
    ),
    purchaseOrder: async (_, { id }, { dataSources: { repository } }) => (
      repository.purchaseOrder.getById(id)
    ),
  },
  Mutation: {
    checkoutCart,
    checkoutOneProduct,
    payPurchaseOrder,
    LinePayConfirm, 
  },
  PurchaseOrder: {
    items: async (order, _, { dataSources: { repository } }) => (
      repository.orderItem.getByIds(order.items)
    ),
    payments: async (order, _, { dataSources: { repository } }) => (
      repository.paymentTransaction.getByIds(order.payments)
    ),
    deliveryOrders: async (order, _, { dataSources: { repository } }) => (
      repository.deliveryOrder.getByIds(order.deliveryOrders)
    ),
    price: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.price,
        currency: order.currency,
      })
    ),
    deliveryPrice: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.deliveryPrice,
        currency: order.currency,
      })
    ),
    total: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.total,
        currency: order.currency,
      })
    ),
  },
};
