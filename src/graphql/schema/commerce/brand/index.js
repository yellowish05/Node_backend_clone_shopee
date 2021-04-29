const { gql } = require('apollo-server');
const uuid = require('uuid/v4');

const updateBrand = require('./resolvers/updateBrand');
const allBrands = require('./resolvers/allBrands');
const searchBrand = require('./resolvers/searchBrand');

const schema = gql`
    type Brand {
        id: ID!
        name: String!
        brandCategories: [BrandCategory]
        productCategories: [ProductCategory]!
        images: [Asset]!
        hashtags: [String]
        countProducts: Int
        banners: [Banner!]
        featureProducts: [Product!]
        featureCategories: [ProductCategory!]
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

    input BrandFilterInput {
      searchQuery: String
      hasProduct: Boolean = true
      hasImage: Boolean
    }

    extend type Query {
        searchBrand(filter: BrandFilterInput = {}, page: PageInput = {}, hasProduct: Boolean = true, query: String): BrandCollection!
        allBrands(hasProduct: Boolean = true, hasLiveStream: Boolean): [Brand]!
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
    searchBrand,
    allBrands,
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
    banners: async ({ banners = [] }, _, { dataSources: { repository } }) => repository.banners.getByIds(banners),
    featureProducts: async ({ id, featureProducts }, _, { dataSources: { repository } }) => repository.product.getByIds(featureProducts).then((products) => {
      if (products.length > 0) { return products; }
      return repository.product.get({
        filter: { brands: [id] },
        sort: { feature: 'SOLD', type: 'DESC' },
        page: { skip: 0, limit: 6 },
      });
    }),
    featureCategories: async ({ id, featureCategories }, _, { dataSources: { repository } }) => repository.productCategory.findByIds(featureCategories).then((categories) => {
      if (categories.length > 0) { return categories; }
      return repository.product.get({
        filter: { brands: [id] },
        sort: { feature: 'SOLD', type: 'DESC' },
        page: { skip: 0, limit: 100 },
      })
        .then((products) => {
          const categoryIds = [];
          products.forEach((product) => {
            if (!categoryIds.includes(product.category)) categoryIds.push(product.category);
          });
          return repository.productCategory.findByIds(categoryIds);
        })
        .then((cates) => cates.slice(0, 6));
    }),
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
  },
};
