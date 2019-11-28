const { gql } = require('apollo-server');

const schema = gql`
    enum PaymentTransactionStatus {
        PENDING
        SUCCESS
        FAIL
        REFUND
    }

    type PaymentTransaction {
        amount: AmountOfMoney!
        method: PaymentMethod!
        status: PaymentTransactionStatus!
        processedAt: Date!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {

};
