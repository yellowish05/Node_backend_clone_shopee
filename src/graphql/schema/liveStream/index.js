const { merge } = require('lodash');

const { typeDefs: lseTypeDefs, resolvers: lseResolvers } = require('./liveStreamExperience');


const typeDefs = [].concat(
  lseTypeDefs,
);

const resolvers = merge(
  lseResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
