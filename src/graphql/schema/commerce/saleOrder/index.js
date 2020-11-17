const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { SaleOrderStatus } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum SaleOrderStatus {
        ${SaleOrderStatus.toGQL()}
    }

    type SaleOrder {
        id: ID!
        buyer: User!
        """ Collected status """
        status: SaleOrderStatus!
        """ List of products or services or anything else what we going to selling """
        items: [OrderProductItem!]!
        """ In Cents, Amount of money Shoclef will charge from Buyer"""
        total: AmountOfMoney!
        """ Address for ship products """
        deliveryOrders: [DeliveryOrder]!
        """ Relation to Payout """
        payout: PayoutOrder
        createdAt: Date
        purchaseOrder: OrderProductItem!
        cancelationReason: String
    }

    type SaleOrderCollection {
        collection: [SaleOrder]!
        pager: Pager
    }

    input SaleOrderFilterInput {
        statuses: [SaleOrderStatus!]
    }

    extend type Query {
      """Allows: authorized user"""
      saleOrders(filter: SaleOrderFilterInput, page: PageInput = {}): SaleOrderCollection! @auth(requires: USER)

      # saleOrder(id: ID!): SaleOrder @auth(requires: USER)
      saleOrdersList(filter: SaleOrderFilterInput, page: PageInput = {}): SaleOrderCollection!
      """Allows: authorized user"""
      saleOrder(id: ID!): SaleOrder
      getPackingSlip(id: ID!): [String]
    }

    extend type Mutation {
        # """Allows: authorized user"""
        # deliverySaleOrder(id: ID, carrier: Carrier!, trackCode: String!): SaleOrder! @auth(requires: USER)
        """Allows: authorized user"""
        cancelSaleOrder(id: ID!, reason: String!): SaleOrder! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    saleOrders: async (_, { page }, { dataSources: { repository }, user }) => (
      repository.saleOrder.find({ user })
        .then((collection) => ({
          collection: collection || [],
          pager: {
            ...page,
            total: 0,
          },
        }))
    ),
    saleOrdersList: async (_, { page }, { dataSources: { repository }, user }) => (
      repository.saleOrder.find({ user })
        .then((collection) => ({
          collection: collection || [],
          pager: {
            ...page,
            total: 0,
          },
        }))
    ),
    saleOrder: async (_, { id }, { dataSources: { repository } }) => (
      repository.saleOrder.getById(id)
    ),
    getPackingSlip: (_, { id }, { dataSources: { repository } }) => repository.saleOrder.getPackingSlip(id)
      .then((orders) => {
        if (orders && orders.length > 0) { return orders; }
      }),
  },
  SaleOrder: {
    buyer: async (order, _, { dataSources: { repository } }) => (
      repository.user.getById(order.buyer)
    ),
    items: async (order, _, { dataSources: { repository } }) => (
      repository.orderItem.getByIds(order.items)
    ),
    deliveryOrders: async (order, _, { dataSources: { repository } }) => (
      repository.deliveryOrder.getByIds(order.deliveryOrders)
    ),
    purchaseOrder: async (order, _, { dataSources: { repository } }) => (
      repository.purchaseOrder.getById(order.purchaseOrder)
    ),
    total: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.total,
        currency: order.currency,
      })
    ),
  },
};
