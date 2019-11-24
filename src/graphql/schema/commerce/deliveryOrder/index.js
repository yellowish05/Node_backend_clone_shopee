const { gql } = require('apollo-server');

const schema = gql`
    enum DeliveryOrderStatus {
        """When Carrier donesn't know this tracking id, not yet in system"""
        UNKNOWN
        ACCEPTED
        IN_TRANSIT
        DELIVERED
    }

    type DeliveryOrderLog {
        id: ID!
        occurredAt: Date!
        address: Address
        description: String!
    }

    type DeliveryOrder {
        trackingNumber: String!
        status: DeliveryOrderStatus!
        estimatedDeliveryDate: Date!
        logs: [DeliveryOrderLog]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {

};
