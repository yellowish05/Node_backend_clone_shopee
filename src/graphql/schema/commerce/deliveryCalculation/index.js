const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const calculateDelivery = require('./resolvers/calculateDelivery');

const schema = gql`
    type DeliveryOptionCalculation {
        carrier: Carrier!
        deliveryDays: Int!
        estimatedDeliveryDate: Date!
        carrierDeliveryDays: String!
        amount(currency: Currency): AmountOfMoney!
    }
  
    type DeliveryCalculation  {
        cheaper: DeliveryOptionCalculation
        faster: DeliveryOptionCalculation
        others: [DeliveryOptionCalculation]!
    }
    
    extend type Mutation {
        calculateDelivery(product: ID!, deliveryAddress: ID!): DeliveryCalculation!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    calculateDelivery,
  },
  DeliveryOptionCalculation: {
    carrier: async (calculation, args, { dataSources: { repository } }) => repository.carrier.getById(calculation.carrier),
    amount: async ({ totalAmount, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ currencyAmount: totalAmount, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
  },
};
