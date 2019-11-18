const { gql } = require('apollo-server');
const path = require('path');

const { Currency } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum CURRENCY {
      ${Currency.toGQL()}
    }

    input IntRangeInput {
        min: Int
        max: Int
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {};
