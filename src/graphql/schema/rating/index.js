const path = require('path');
const { gql } = require('apollo-server');

const { RatingTarget } = require(path.resolve('src/lib/Enums'));

const rateProduct = require('./resolvers/rateProduct');
const rateOrganization = require('./resolvers/rateOrganization');
const rateProductByOrder = require('./resolvers/rateProductByOrder');

const schema = gql`
    enum RatingTargetType {
      ${ RatingTarget.toGQL() }
    }

    union RatingTarget = Product | Organization | User

    type Review {
      target: RatingTarget!
      tag: String!
      rating: Float!
      message: String
      user: User!
      order: OrderProductItem
      language: LanguageDetails
    }

    input RatingOrderInput {
      message: String
      order: ID!
      product: ID!
      rating: Float!
    }

    extend type Mutation {
        """
          - Allows: authorized user.
          - @deprecated: Use "rateProductByOrder" instead.
        """
        rateProduct(product: ID!, rating: Int!, message: String): Boolean! @auth(requires: USER) @deprecated(reason: "use 'rateProductByOrder' instead")
        
        """Allows: authorized user"""
        rateOrganization(organization: ID!, rating: Int!, message: String): Boolean! @auth(requires: USER)
        
        """Allows: authorized user"""
        rateProductByOrder(data: RatingOrderInput): Review @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Mutation: {
    rateProduct,
    rateProductByOrder,
    rateOrganization,
  },
  Review: {
    target: async ({ tag }, _, { dataSources: { repository }}) => {
      const targetType = function(str) { return str.charAt(0).toLowerCase() + str.slice(1); }(tag.split(':')[0]);
      const targetId = tag.split(':')[1];
      return repository[targetType].getById(targetId);
    },
    rating: ({ rating }) => rating.toFixed(1),
    order: async ({ order }, _, { dataSources: { repository }}) => {
      return order ? repository.orderItem.getById(order) : null;
    },
    user: async ({ user }, _, { dataSources: { repository }}) => repository.user.getById(user),
    language: async ({ lang }, _, { dataSources: { repository }}) => repository.language.getById(lang),
  },
  RatingTarget: {
    __resolveType(ratingTarget) {
      if (ratingTarget.price) {
        return 'Product';
      } else if (ratingTarget.email) {
        return 'User';
      } else if (ratingTarget.owner) {
        return 'Organization';
      } else {
        return null;
      }
    }
  },
};
