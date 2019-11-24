const { gql } = require('apollo-server');

const schema = gql`
    enum SaleOrderStatus {
        CREATED
        CONFIRMED
        CARRIER_RECEIVED
        DELIVERED
        COMPLETE
        CANCELED
    }

    type SaleOrder {
        id: ID!
        buyer: User!
        """ Collected status """
        status: SaleOrderStatus!
        """ List of products or services or anything else what we going to selling """
        items: [OrderItemInterface!]!
        """ In Cents, Amount of money Shoclef will charge from Buyer"""
        price(currency: CURRENCY): AmountOfMoney!
        """ Address for ship products """
        deliveryAddress: DeliveryAddress!
        """ Relation to Payout """
        payout: PayoutOrder
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
        saleOrders(filter: SaleOrderFilterInput, page: PageInput = {}): SaleOrderCollection!
        saleOrder(id: ID!): SaleOrder
    }

    extend type Mutation {
        """Allows: authorized user"""
        confirmSaleOrder(id: ID!): SaleOrder! @auth(requires: USER)
        """Allows: authorized user"""
        deliverySaleOrder(id: ID, carrier: CARRIER!, trackCode: String!): SaleOrder! @auth(requires: USER)
        """Allows: authorized user"""
        cancelSaleOrder(id: ID!, reason: String!): SaleOrder! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {

};
