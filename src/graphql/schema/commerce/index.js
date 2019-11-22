const { merge } = require('lodash');

const { typeDefs: commonTypeDefs, resolvers: commonResolvers } = require('./common');
const { typeDefs: brandTypeDefs, resolvers: brandResolvers } = require('./brand');
const { typeDefs: cartTypeDefs, resolvers: cartResolvers } = require('./cart');
const { typeDefs: productCategoryTypeDefs, resolvers: productCategoryResolvers } = require('./productCategory');
const { typeDefs: productTypeDefs, resolvers: productResolvers } = require('./product');

const typeDefs = [].concat(
  brandTypeDefs,
  cartTypeDefs,
  productCategoryTypeDefs,
  productTypeDefs,
  commonTypeDefs,
);

const resolvers = merge(
  brandResolvers,
  cartResolvers,
  productCategoryResolvers,
  productResolvers,
  commonResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
