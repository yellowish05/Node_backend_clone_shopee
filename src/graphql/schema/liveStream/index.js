const { merge } = require('lodash');

const { typeDefs: experienceTypeDefs, resolvers: experienceResolvers } = require('./liveStreamExperience');
const { typeDefs: categoryTypeDefs, resolvers: categoryResolvers } = require('./liveStreamCategory');


const typeDefs = [].concat(
  experienceTypeDefs,
  categoryTypeDefs,
);

const resolvers = merge(
  experienceResolvers,
  categoryResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
