const path = require('path');
const { gql } = require('apollo-server');
const { ThemeType } = require(path.resolve('src/lib/Enums'));

const addTheme = require('./resolvers/addTheme');
const updateTheme = require('./resolvers/updateTheme');
const deleteTheme = require('./resolvers/deleteTheme');
const themes = require('./resolvers/themes');

const schema = gql`
  enum ThemeType {
    ${ThemeType.toGQL()}
  }

  """
      - start_time and end_time: needed for type "LIMITED_TIME" only
  """
  type Theme {
    id: ID!
    name: String!
    thumbnail: Asset!
    hashtags: [String]
    productCategories: [ProductCategory]
    brandCategories: [BrandCategory]
    brands: [Brand]
    type: ThemeType!
    """
      needed for type "LIMITED_TIME" only
    """
    start_time: Date
    """
      needed for type "LIMITED_TIME" only
    """
    end_time: Date
  }

  input ThemeInput {
    name: String!
    thumbnail: String!
    hashtags: [String!]!
    productCategories: [String]
    brandCategories: [String]
    brands: [String]
    """
      for type "LIMITED_TIME", start_time and end_time are required.
    """
    type: ThemeType = NORMAL
    """
      needed for type "LIMITED_TIME" only
    """
    start_time: Date
    """
      needed for type "LIMITED_TIME" only
    """
    end_time: Date
  }

  input ThemeUpdateInput {
    name: String
    thumbnail: String
    hashtags: [String]
    productCategories: [String]
    brandCategories: [String]
    brands: [String]
    type: ThemeType
    start_time: Date
    end_tiem: Date
  }

  input ThemeFilterInput {
    searchQuery: String
  }

  input ThemeSortInput {
    feature: ThemeSortFeature! = CREATED_AT
    type: SortTypeEnum! = ASC
  }

  enum ThemeSortFeature {
    NAME
    CREATED_AT
  }

  type ThemeCollection {
    collection: [Theme]!
    pager: Pager
  }

  extend type Query {
    theme(id: ID!): Theme
    themes(
        filter: ThemeFilterInput, 
        sort: ThemeSortInput, 
        page: PageInput = {}): ThemeCollection! @auth(requires: USER)
  }

  extend type Mutation {
    addTheme(data: ThemeInput!): Theme! @auth(requires: USER)
    updateTheme(id: ID!, data: ThemeUpdateInput): Theme @auth(requires: USER)
    deleteTheme(id: ID!): Boolean! @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    theme: async (_, { id }, { dataSources: { repository } } ) => {
      return repository.theme.getById(id);
    },
    themes,
  },
  Mutation: {
    addTheme,
    updateTheme,
    deleteTheme,
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
    type: async (theme) => (theme.type || "NORMAL"),
  }
};
