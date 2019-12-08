const path = require('path');
const { gql, withFilter } = require('apollo-server');

const { baseURL } = require(path.resolve('config'));

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));
const pubsub = require(path.resolve('config/pubsub'));

const schema = gql`
    enum PaymentTransactionStatus {
        ${PaymentTransactionStatus.toGQL()}
    }

    type PaymentNotification {
      format: String!
      url: String!
    }

    type PaymentTransaction {
      id: ID!
      merchant: ID!
      createdAt: Date!
      signature: String!
      type: String!
      amount: AmountOfMoney!
      status: PaymentTransactionStatus!
      processedAt: Date
      tags: [String!]
      notification: PaymentNotification!
    }

    extend type Subscription {
      paymentTransactionProcessed(id: ID!): PaymentTransaction! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Subscription: {
    paymentTransactionProcessed: {
      resolve: (payload) => payload,
      subscribe: withFilter(
        () => pubsub.asyncIterator(['PAYMENT_TRANSACTION_CHANGED']),
        (payload, variables) => payload.id === variables.id,
      ),
    },
  },
  PaymentTransaction: {
    notification: () => ({
      format: 'FORMAT_JSON_SIGNED',
      url: `${baseURL}webhooks/payment/wirecard`,
    }),
    amount: async (transaction) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: transaction.amount,
        currency: transaction.currency,
      })
    ),
  },
};
