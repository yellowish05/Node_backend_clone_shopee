const { gql } = require('apollo-server');

const schema = gql`
    enum ShoppingCourierType {
      domestic
      international
    }

    type ShoppingCourier {
      id: ID!
      name: String
      type: [ShoppingCourierType]
    }

    input ShoppingCourierFilter {
      "Filter all possible ways for the country. Country Id is a Country ISO Code"
      countryId: String
    }

    extend type Query {
      shoppingCouriers(filter: ShoppingCourierFilter): [ShoppingCourier]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    shoppingCouriers: () => ([
      {
        id: 1,
        name: 'UPS',
        type: ['international', 'domestic'],
      },
    ]),
  },
};
