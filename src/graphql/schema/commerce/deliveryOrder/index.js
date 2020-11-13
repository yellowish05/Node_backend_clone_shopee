const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { DeliveryOrderStatus } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum DeliveryOrderStatus {
        ${DeliveryOrderStatus.toGQL()}
    }

    type DeliveryOrderLog {
        id: ID!
        occurredAt: Date!
        address: Address
        description: String!
    }

    type DeliveryOrder {
      id: ID!
      trackingNumber: String!
      status: DeliveryOrderStatus!
      estimatedDeliveryDate: Date
      deliveryPrice: AmountOfMoney!
      deliveryAddress: DeliveryAddress!
      logs: [DeliveryOrderLog]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  DeliveryOrder: {
    deliveryPrice: async (item) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: item.deliveryPrice,
        currency: item.currency,
      })
    ),
    deliveryAddress: async (order, _, { dataSources: { repository } }) => (
      repository.deliveryAddress.getById(order.deliveryAddress)
    ),
  },
};
