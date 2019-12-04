const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { OrderItemStatus } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum OrderItemStatus {
        ${OrderItemStatus.toGQL()}
    }

    type OrderItemLog {
        id: ID!
        date: Date!
        oldStatus: OrderItemStatus!
        newStatus: OrderItemStatus!
        whoChanged: User!
        tags: [String!]
    }

    interface OrderItemInterface {
        id: ID!
        title: String!
        status: OrderItemStatus!
        """ In Units """
        quantity: Int!
        price: AmountOfMoney!
        total: AmountOfMoney!
        seller: User!
        deliveryOrder: DeliveryOrder
        log: OrderItemLog!
    }

    type OrderProductItem implements OrderItemInterface {
        id: ID!
        title: String!
        product: Product!
        """ In Units """
        quantity: Int!
        price: AmountOfMoney!
        total: AmountOfMoney!
        seller: User!
        status: OrderItemStatus!
        deliveryOrder: DeliveryOrder
        log: OrderItemLog!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  OrderProductItem: {
    seller: async (item, _, { dataSources: { repository } }) => (
      repository.user.getById(item.seller)
    ),
    price: async (item) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: item.price,
        currency: item.currency,
      })
    ),
    total: async (item) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: item.total,
        currency: item.currency,
      })
    ),
  },
  OrderItemInterface: {
    __resolveType(item) {
      if (item.product) {
        return 'OrderProductItem';
      }

      return null;
    },
  },
};
