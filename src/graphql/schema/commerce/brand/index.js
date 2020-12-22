const { gql } = require('apollo-server');
const uuid = require('uuid/v4');

const updateBrand = require('./resolvers/updateBrand');

const schema = gql`
    type Brand {
        id: ID!
        name: String!
        brandCategories: [BrandCategory]
        productCategories: [ProductCategory]!
        images: [Asset]!
        hashtags: [String]
    }

    input BrandInput{
      name: String!
      images: [String]!
      hashtags: [String]
    }

    input BrandUpdateInput{
      name: String
      images: [String]
      productCategories: [String]
      brandCategories: [String]
    }

    type BrandCollection {
        collection: [Brand]!
        pager: Pager
    }

    extend type Query {
        searchBrand(query: String, page: PageInput = {}): BrandCollection!
        brand(id: ID!): Brand
    }

    extend type Mutation {
      addBrand(data:BrandInput!): Brand! @auth(requires: USER)
      updateBrand(id: ID!, data: BrandUpdateInput!): Brand! @auth(requires: USER)
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

      // if (query.length < 1) {
      //   return result;
      // }

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
    brandCategories: async (brand, _, { dataSources: { repository }}) => {
      if (!brand.brandCategories || !brand.brandCategories.length) {
        return [];
      }
      return repository.brandCategory.findByIds(brand.brandCategories);
    },
    productCategories: async (brand, _, { dataSources: { repository } }) => {
      if (!brand.productCategories.length) {
        return [];
      }
      return repository.productCategory.findByIds(brand.productCategories);
    },
    images: async (brand, _, { dataSources: { repository } }) => {
      if (!brand.images.length) {
        return [];
      }
      return repository.asset.getByIds(brand.images);
    },
  },
  Mutation: {
    addBrand: async (_, args, { dataSources: { repository } }) => {
      return repository.brand.create({
        _id: uuid(),
        name: args.data.name,
        images: args.data.images,
        hashtags: args.data.hashtags || [],
      })
    },
    updateBrand,
  }
};
