const { gql } = require('apollo-server');

const rateProduct = require('./resolvers/rateProduct');
const rateOrganization = require('./resolvers/rateOrganization');

const schema = gql`
    extend type Mutation {
        """Allows: authorized user"""
        rateProduct(product: ID!, rating: Int!, message: String): Boolean! @auth(requires: USER)
        """Allows: authorized user"""
        rateOrganization(organization: ID!, rating: Int!, message: String): Boolean! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    rateProduct,
    rateOrganization,
  },
};
