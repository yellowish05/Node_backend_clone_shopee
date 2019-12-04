const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));


const schema = gql`
    enum PaymentTransactionStatus {
        ${PaymentTransactionStatus.toGQL()}
    }

    type PaymentTransaction {
        merchant: ID!
        createdAt: Date!
        signature: String!
        type: String!
        amount: AmountOfMoney!
        status: PaymentTransactionStatus!
        processedAt: Date
        tags: [String!]
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  PaymentTransaction: {
    amount: async (transaction) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: transaction.amount,
        currency: transaction.currency,
      })
    ),
  },
};
