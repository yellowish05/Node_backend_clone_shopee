const { gql } = require('apollo-server');
const path = require('path');

const { Currency, WeightUnitSystem } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum Currency {
      ${Currency.toGQL()}
    }

    enum WeightUnitSystem {
      ${WeightUnitSystem.toGQL()}
    }
    
    type AmountOfMoney {
      """In cents"""
      amount: Int!
      currency: Currency!
      formatted: String!
    }

    input IntRangeInput {
        min: Int
        max: Int
    }

    input AmountOfMoneyInput {
        amount: Float
        currency: Currency
    }

    input AmountOfMoneyRangeInput {
        min: AmountOfMoneyInput
        max: AmountOfMoneyInput
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  AmountOfMoney: {
    amount: async (amount) => amount.getCentsAmount(),
    currency: async (amount) => amount.getCurrency(),
    formatted: async (amount) => amount.getFormatted(),
  },
};
