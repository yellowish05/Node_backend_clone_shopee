const { gql } = require('apollo-server');
const uuid = require('uuid/v4');

const schema = gql`
    type Brand {
        id: ID!
        name: String!
        categories: [ProductCategory]!
    }

    input BrandInput{
      name: String!
    }

    type BrandCollection {
        collection: [Brand]!
        pager: Pager
    }

    extend type Query {
        searchBrand(query: String!, page: PageInput = {}): BrandCollection!
    }

    extend type Mutation {
      addBrand(data:BrandInput!): Brand! @auth(requires: USER)
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

      if (query.length < 2) {
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
  },
  Brand: {
    categories: async (brand, _, { dataSources: { repository } }) => {
      if (!brand.productCategories.length) {
        return [];
      }
      return repository.productCategory.findByIds(brand.productCategories);
    },
  },
  Mutation: {
    addBrand: async (_, args, { dataSources: { repository } }) => {
      return repository.brand.create({
        _id: uuid(),
        name: args.data.name,
      })
    }
  }
};
