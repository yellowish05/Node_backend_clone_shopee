const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const calculateDelivery = require('./resolvers/calculateDelivery');
const calculateDeliveryRates = require('./resolvers/calculateDeliveryRates');

const schema = gql`
    type DeliveryRate {
      id: ID!
      carrier: Carrier!
      deliveryDays: Int!
      estimatedDeliveryDate: Date!
      carrierDeliveryDays: String!
      amount(currency: Currency): AmountOfMoney!
    }

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
      calculateDeliveryRates(product: ID!, quantity: Int!, deliveryAddress: ID!): [DeliveryRate]! 
      calculateDelivery(product: ID!, deliveryAddress: ID!): DeliveryCalculation! @deprecated(reason: "Use 'calculateDeliveryRates' instead")
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    calculateDelivery,
    calculateDeliveryRates,
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
  DeliveryRate: {
    carrier: async (calculation, args, { dataSources: { repository } }) => repository.carrier.getById(calculation.carrier),
    amount: async ({ amount, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: amount, currency });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
  },
};
