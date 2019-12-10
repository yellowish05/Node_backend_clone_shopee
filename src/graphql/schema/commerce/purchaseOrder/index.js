const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const checkoutCart = require('./resolvers/checkoutCart');
const checkoutOneProduct = require('./resolvers/checkoutOneProduct');
const payPurchaseOrder = require('./resolvers/payPurchaseOrder');

const { PurchaseOrderStatus } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum PurchaseOrderStatus {
        ${PurchaseOrderStatus.toGQL()}
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
        total: AmountOfMoney!
        """ In future buyer will be able to pay by few paymnets to one Order"""
        payments: [PaymentTransaction!]
        """ Address for ship products """
        deliveryAddress: DeliveryAddress!
        cancelationReason: String
    }

    type PurchaseOrderCollection {
        collection: [PurchaseOrder]!
        pager: Pager
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
        checkoutCart(deliveryAddress: ID!, currency: Currency!): PurchaseOrder! @auth(requires: USER)

        """Allows: authorized user"""
        checkoutOneProduct(deliveryAddress: ID!, product: ID!, quantity: Int!, currency: Currency!): PurchaseOrder! @auth(requires: USER)

        """Allows: authorized user"""
        cancelPurchaseOrder(id: ID!, reason: String!): PurchaseOrder! @auth(requires: USER)

        """
        Allows: authorized user
        Pass ID of the Order you want to pay
        """
        payPurchaseOrder(id: ID!): PaymentTransaction! @auth(requires: USER)
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
  },
  PurchaseOrder: {
    items: async (order, _, { dataSources: { repository } }) => (
      repository.orderItem.getByIds(order.items)
    ),
    payments: async (order, _, { dataSources: { repository } }) => (
      repository.paymentTransaction.getByIds(order.payments)
    ),
    deliveryAddress: async (order, _, { dataSources: { repository } }) => (
      repository.deliveryAddress.getById(order.deliveryAddress)
    ),
    total: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.total,
        currency: order.currency,
      })
    ),
  },
};
