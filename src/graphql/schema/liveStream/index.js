const { merge } = require('lodash');

const { typeDefs: experienceTypeDefs, resolvers: experienceResolvers } = require('./liveStreamExperience');
const { typeDefs: categoryTypeDefs, resolvers: categoryResolvers } = require('./liveStreamCategory');
const { typeDefs: testSubscriptionTypeDefs, resolvers: testSubscriptionResolvers } = require('./testSubscription');

const typeDefs = [].concat(
  experienceTypeDefs,
  categoryTypeDefs,
  testSubscriptionTypeDefs,
);

const resolvers = merge(
  experienceResolvers,
  categoryResolvers,
  testSubscriptionResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
