const { merge } = require('lodash');

const { typeDefs: commonTypeDefs, resolvers: commonResolvers } = require('./common');

const typeDefs = [].concat(commonTypeDefs);

const resolvers = merge(
  {},
  commonResolvers,
);

module.exports = {
  typeDefs, resolvers,
};
