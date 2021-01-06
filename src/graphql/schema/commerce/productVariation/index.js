const path = require('path');
const { gql } = require('apollo-server');
const { ThemeType } = require(path.resolve('src/lib/Enums'));

const addProductVariation = require('./resolvers/addProductVariation');
const updateProductVariation = require('./resolvers/updateProductVariation');
const deleteProductVariation = require('./resolvers/deleteProductVariation');
const productVariations = require('./resolvers/productVariations');

const schema = gql`

  type ProductVariation {
    id: ID!
    """
      - used on admin & seller side
    """
    name: String!
    description: String
    values: [String!]!
    """
      - used in productAttributes.variations.name
      - must be unique in the collection
    """
    keyName: String!
    """
      - used to name the filter row in the group filter.
    """
    displayName: String!
  }

  input ProductVariationInput {
    name: String!
    description: String
    values: [String!]!
    keyName: String!
    displayName: String!
  }

  input ProductVariationUpdateInput {
    name: String
    description: String
    values: [String!]
    keyName: String
    displayName: String
  }

  input ProductVariationFilterInput {
    searchQuery: String
  }

  input ProductVariationSortInput {
    feature: ThemeSortFeature! = CREATED_AT
    type: SortTypeEnum! = ASC
  }

  enum ProductVariationSortFeature {
    NAME
    CREATED_AT
  }

  type ProductVariationCollection {
    collection: [ProductVariation]!
    pager: Pager
  }

  extend type Query {
    productVariation(id: ID!): ProductVariation
    productVariationByKeyName(keyName: String!): ProductVariation
    productVariations(
        filter: ProductVariationFilterInput = {}, 
        sort: ProductVariationSortInput = {}, 
        page: PageInput = {}): ProductVariationCollection! @auth(requires: USER)
  }

  extend type Mutation {
    addProductVariation(data: ProductVariationInput!): ProductVariation! @auth(requires: USER)
    updateProductVariation(id: ID!, data: ProductVariationUpdateInput): ProductVariation @auth(requires: USER)
    deleteProductVariation(id: ID!): Boolean! @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    productVariation: async (_, { id }, { dataSources: { repository } } ) => {
      return repository.productVariation.getById(id);
    },
    productVariationByKeyName: async (_, { keyName }, { dataSources: { repository } }) => {
      return repository.productVariation.getByKeyName(keyName);
    },
    productVariations,
  },
  Mutation: {
    addProductVariation,
    updateProductVariation,
    deleteProductVariation,
  },
};
