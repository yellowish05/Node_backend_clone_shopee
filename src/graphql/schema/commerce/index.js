const { merge } = require('lodash');

const { typeDefs: commonTypeDefs, resolvers: commonResolvers } = require('./common');
const { typeDefs: brandTypeDefs, resolvers: brandResolvers } = require('./brand');
const { typeDefs: productCategoryTypeDefs, resolvers: productCategoryResolvers } = require('./productCategory');
const { typeDefs: productTypeDefs, resolvers: productResolvers } = require('./product');

const typeDefs = [].concat(
  brandTypeDefs,
  productCategoryTypeDefs,
  productTypeDefs,
  commonTypeDefs,
);

const resolvers = merge(
  brandResolvers,
  productCategoryResolvers,
  productResolvers,
  commonResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
