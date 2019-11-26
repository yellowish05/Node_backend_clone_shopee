const path = require('path');
const { gql } = require('apollo-server');

const { SizeUnitSystem } = require(path.resolve('src/lib/Enums'));
const addShippingBox = require('./resolvers/addShippingBox');
const removeShippingBox = require('./resolvers/removeShippingBox');

const schema = gql`
    enum SizeUnitSystem {
      ${SizeUnitSystem.toGQL()}
    }

    type ShippingBox {
      id: ID!
      label: String!
      width: Float!
      height: Float!
      length: Float!
      unit: SizeUnitSystem!
    }

    input ShippingBoxInput {
      label: String!
      width: Float!
      height: Float!
      length: Float!
      unit: SizeUnitSystem!
    }

    extend type Query {
      shippingBoxes: [ShippingBox]! @auth(requires: USER)
    }

    extend type Mutation {
        addShippingBox(data: ShippingBoxInput!): ShippingBox! @auth(requires: USER)
        removeShippingBox(id: ID!): Boolean! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    shippingBoxes(_, args, { dataSources: { repository }, user }) {
      return repository.shippingBox.getAll({ owner: user.id });
    },
  },
  Mutation: {
    addShippingBox,
    removeShippingBox,
  },
};
