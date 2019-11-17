const { gql } = require('apollo-server');

const schema = gql`
    type ProductCategory {
        id: ID!
        name: String
        level: Int!
        parent: ProductCategory
        liveStreamCategory: LiveStreamCategory
    }

    type ProductCategoryCollection {
        collection: [ProductCategory]!
        pager: Pager
    }

    extend type Query {
        searchProductCategory(query: String!, page: PageInput = {}): ProductCategoryCollection!
        productCategories(parent: ID, page: PageInput = {}): ProductCategoryCollection!
    }
`;

module.exports.typeDefs = [schema];


const emptyResult = {
  collection: [],
  pager: {
    total: 0,
  },
};

function composeTypeResult(page) {
  return ([collection, total]) => ({
    ...emptyResult,
    collection: collection || [],
    pager: {
      ...page, total,
    },
  });
}

module.exports.resolvers = {
  Query: {
    searchProductCategory: async (_, { query, page }, { dataSources: { repository } }) => {
      if (query.length < 2) {
        return composeTypeResult(page)([null, 0]);
      }

      return Promise.all([
        repository.productCategory.searchByName(query, page),
        repository.productCategory.getCountBySearch(query),
      ])
        .then(composeTypeResult(page));
    },
    productCategories: async (_, { parent = null, page }, { dataSources: { repository } }) => (
      Promise.all([
        repository.productCategory.getByParent(parent, page),
        repository.productCategory.getCountByParent(parent),
      ])
        .then(composeTypeResult(page))
    ),
  },
  ProductCategory: {
    parent: async (productCategory, _, { dataSources: { repository } }) => {
      if (!productCategory.parent) {
        return null;
      }
      return repository.productCategory.getById(productCategory.parent);
    },
    liveStreamCategory: async (productCategory, _, { dataSources: { repository } }) => {
      if (!productCategory.liveStreamCategory) {
        return null;
      }
      return repository.liveStreamCategory.getById(productCategory.liveStreamCategory);
    },
  },
};
