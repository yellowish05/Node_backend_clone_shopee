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
    name: String!
    description: String
    values: [String!]!
    keyName: String!
  }

  input ProductVariationInput {
    name: String!
    description: String
    values: [String!]!
    keyName: String!
  }

  input ProductVariationUpdateInput {
    name: String
    description: String
    values: String
    keyName: String
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
    productVariations,
  },
  Mutation: {
    addProductVariation,
    updateProductVariation,
    deleteProductVariation,
  },
};
