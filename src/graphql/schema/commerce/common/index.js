const { gql } = require('apollo-server');
const path = require('path');

const { Currency, WeightUnitSystem } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum CURRENCY {
      ${Currency.toGQL()}
    }

    enum WeightUnitSystem {
      ${WeightUnitSystem.toGQL()}
    }

    input IntRangeInput {
        min: Int
        max: Int
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {};
