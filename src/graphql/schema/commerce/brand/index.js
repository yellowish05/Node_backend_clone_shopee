const { gql } = require('apollo-server');

const schema = gql`
    type Brand {
        id: ID!
        name: String!
        categories: [ProductCategory]!
    }

    type BrandCollection {
        collection: [Brand]!
        pager: Pager
    }

    extend type Query {
        searchBrand(query: String!, page: PageInput = {}): BrandCollection!
        brand(id: ID!): Brand
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    searchBrand: async (_, { query, page }, { dataSources: { repository } }) => {
      const result = {
        collection: [],
        pager: {
          ...page,
          total: 0,
        },
      };

      if (query.length < 1) {
        return result;
      }

      return Promise.all([
        repository.brand.searchByName(query, page),
        repository.brand.getCountBySearch(query),
      ])
        .then(([collection, total]) => {
          result.collection = collection || [];
          result.pager.total = total;
          return result;
        });
    },
    brand: async (_, { id }, { dataSources: { repository } }) => repository.brand.getById(id),
  },
  Brand: {
    categories: async (brand, _, { dataSources: { repository } }) => {
      if (!brand.productCategories.length) {
        return [];
      }
      return repository.productCategory.findByIds(brand.productCategories);
    },
  },
};
