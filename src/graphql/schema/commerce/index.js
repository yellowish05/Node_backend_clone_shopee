const { merge } = require('lodash');

const { typeDefs: brandTypeDefs, resolvers: brandResolvers } = require('./brand');
const { typeDefs: productCategoryTypeDefs, resolvers: productCategoryResolvers } = require('./productCategory');

const typeDefs = [].concat(
  brandTypeDefs,
  productCategoryTypeDefs,
);

const resolvers = merge(
  brandResolvers,
  productCategoryResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
