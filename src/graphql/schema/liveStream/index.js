const { merge } = require('lodash');

const { typeDefs: experienceTypeDefs, resolvers: experienceResolvers } = require('./liveStreamExperience');
const { typeDefs: categoryTypeDefs, resolvers: categoryResolvers } = require('./liveStreamCategory');
const { typeDefs: testSubscriptionTypeDefs, resolvers: testSubscriptionResolvers } = require('./testSubscription');
const { typeDefs: livestreamTypeDefs, resolvers: livestreamResolvers } = require('./liveStream');


const typeDefs = [].concat(
  experienceTypeDefs,
  categoryTypeDefs,
  testSubscriptionTypeDefs,
  livestreamTypeDefs,
);

const resolvers = merge(
  experienceResolvers,
  categoryResolvers,
  testSubscriptionResolvers,
  livestreamResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
