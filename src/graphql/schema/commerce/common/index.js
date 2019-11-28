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

    input IntRangeInput {
        min: Int
        max: Int
    }

    type AmountOfMoney {
      """In cents"""
      amount: Int!
      currency: Currency!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
};
