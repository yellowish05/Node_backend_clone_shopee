const { merge } = require('lodash');

const { typeDefs: brandTypeDefs, resolvers: brandResolvers } = require('./brand');

const typeDefs = [].concat(
  brandTypeDefs,
);

const resolvers = merge(
  brandResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
