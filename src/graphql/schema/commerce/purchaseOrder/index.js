const { gql } = require('apollo-server');

const schema = gql`
    enum PurchaseOrderStatus {
        CREATED
        ORDERED
        CARRIER_RECEIVED
        DELIVERED
        COMPLETE
        CANCELED
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
        price(currency: Currency): AmountOfMoney!
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
        purchaseOrders(filter: PurchaseOrderFilterInput, page: PageInput = {}): PurchaseOrderCollection!
        purchaseOrder(id: ID!): PurchaseOrder
    }

    extend type Mutation {
        """Allows: authorized user"""
        checkoutCart(paymentMethod: ID!, shippingAddress: ID!): PurchaseOrder! @auth(requires: USER)
        """Allows: authorized user"""
        cancelPurchaseOrder(id: ID!, reason: String!): PurchaseOrder! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {

};
