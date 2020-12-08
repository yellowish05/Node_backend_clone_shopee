const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { DeliveryOrderStatus } = require(path.resolve('src/lib/Enums'));

const updateDeliveryOrder = require('./resolvers/updateDeliveryOrder');
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

    type carrierType {
      id: ID!
      name: String
    }

    type DeliveryOrder {
      id: ID!
      trackingNumber: String
      status: DeliveryOrderStatus!
      estimatedDeliveryDate: Date
      deliveryPrice: AmountOfMoney!
      deliveryAddress: DeliveryAddress!
      proofPhoto: [Asset]
      carrier: carrierType
    }

    input UpdateDeliveryOrderInput {
      trackingNumber: String!
      carrier: String!
      estimatedDeliveryDate: Date!
      proofPhoto: ID,
      saleOrderId: ID!
    }

    extend type Mutation {
      """
          Allows: authorized user & user must be a seller
      """
      updateDeliveryOrder(ids: [ID!]!, data: UpdateDeliveryOrderInput!): [DeliveryOrder!] @auth(requires: USER)
  }
`;
// 10-29
// type DeliveryOrder {
//   id: ID!
//   trackingNumber: String!
//   status: DeliveryOrderStatus!
//   estimatedDeliveryDate: Date
//   deliveryPrice: AmountOfMoney!
//   deliveryAddress: DeliveryAddress!
//   logs: [DeliveryOrderLog]!
//   proofPhoto: [Asset]
// }

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    updateDeliveryOrder
  },
  DeliveryOrder: {
    deliveryPrice: async (item) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: item.deliveryPrice,
        currency: item.currency,
      })
    ),
    proofPhoto: async ({ proofPhoto }, _, { dataSources: { repository } }) => (
      proofPhoto ? repository.asset.getById(proofPhoto) : null
    ),
    deliveryAddress: async (order, _, { dataSources: { repository } }) => (
      repository.deliveryAddress.getById(order.deliveryAddress)
    ),
    carrier: async ({ carrier }, _, { dataSources: { repository } }) => {
      let carrierInfo = await repository.customCarrier.getById(carrier);
      if (!carrierInfo) {
        carrierInfo = await repository.carrier.getById(carrier);
      }
      return {
        id: carrierInfo.id,
        name: carrierInfo.name,
      }
    }
  },
};
