const { gql } = require('apollo-server');

const schema = gql`
    enum OrderItemStatus {
        ORDERED
        CONFIRMED
        CARRIER_RECEIVED
        DELIVERED
        COMPLETE
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
        status: OrderItemStatus!
        """ In Units """
        quantity: Int!
        unitPrice(currency: CURRENCY): AmountOfMoney!
        discount(currency: CURRENCY): AmountOfMoney!
        price(currency: CURRENCY): AmountOfMoney!
        seller: User!
        deliveryOrder: DeliveryOrder
        log: OrderItemLog!
    }

    type OrderProduct implements OrderItemInterface {
        id: ID!
        product: Product!
        """ In Units """
        quantity: Int!
        unitPrice(currency: CURRENCY): AmountOfMoney!
        discount(currency: CURRENCY): AmountOfMoney!
        price(currency: CURRENCY): AmountOfMoney!
        seller: User!
        status: OrderItemStatus!
        deliveryOrder: DeliveryOrder
        log: OrderItemLog!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {

};
