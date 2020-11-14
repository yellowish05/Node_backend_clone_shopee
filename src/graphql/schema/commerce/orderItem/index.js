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
        deliveryPrice: AmountOfMoney!
        total: AmountOfMoney!
        seller: User!
        deliveryOrder: DeliveryOrder
        log: OrderItemLog!
        billingAddress: DeliveryAddress!
    }

    type OrderProductItem implements OrderItemInterface {
        id: ID!
        title: String!
        product: Product!
        """ In Units """
        quantity: Int!
        price: AmountOfMoney!
        deliveryPrice: AmountOfMoney!
        total: AmountOfMoney!
        seller: User!
        status: OrderItemStatus!
        deliveryOrder: DeliveryOrder
        log: OrderItemLog!
        billingAddress: DeliveryAddress!
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
    deliveryPrice: async (item) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: item.deliveryPrice,
        currency: item.currency,
      })
    ),
    total: async (item) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: item.total,
        currency: item.currency,
      })
    ),
    product: async (item, _, { dataSources: { repository } }) => (
      repository.product.getById(item.product)
    ),
    deliveryOrder: async (item, _, { dataSources: { repository } }) => (
      repository.deliveryOrder.findByOrderItem(item.id)
    ),
    billingAddress: async (item, _, { dataSources: { repository } }) => repository.billingAddress.getById(item.billingAddress),
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
