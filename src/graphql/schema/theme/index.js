const path = require('path');
const { gql } = require('apollo-server');

const addTheme = require('./resolvers/addTheme');
const updateTheme = require('./resolvers/updateTheme');

const schema = gql`
  type Theme {
    id: ID!
    name: String!
    thumbnail: Asset!
    hashtags: [String]
    productCategories: [ProductCategory]
    brandCategories: [BrandCategory]
    brands: [Brand]
  }

  input ThemeInput {
    name: String!
    thumbnail: String!
    hashtags: [String!]!
    productCategories: [String]
    brandCategories: [String]
    brands: [String]
  }

  input ThemeUpdateInput {
    name: String
    thumbnail: String
    hashtags: [String]
    productCategories: [String]
    brandCategories: [String]
    brands: [String]
  }

  extend type Query {
    theme(id: ID!): Theme
  }

  extend type Mutation {
    addTheme(data: ThemeInput!): Theme! @auth(requires: USER)
    updateTheme(id: ID!, data: ThemeUpdateInput): Theme @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    theme: async (_, { id }, { dataSources: { repository } } ) => {
      return repository.theme.getById(id);
    }
  },
  Mutation: {
    addTheme,
    updateTheme,
  },
  Theme: {
    thumbnail: async (theme, _, { dataSources: { repository }}) => {
      return theme.thumbnail ? repository.asset.getById(theme.thumbnail) : null;
    },
    productCategories: async (theme, _, { dataSources: { repository } }) => {
      return theme.productCategories && theme.productCategories.length ? repository.productCategory.findByIds(theme.productCategories) : [];
    },
    brandCategories: async (theme, _, { dataSources: { repository }}) => {
      return theme.brandCategories && theme.brandCategories.length ? repository.brandCategory.findByIds(theme.brandCategories) : [];
    },
    brands: async (theme, _, { dataSources: { repository }}) => {
      return theme.brands && theme.brands.length ? repository.brand.getByIds(theme.brands) : [];
    },
  }
};
