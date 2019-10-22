const { gql, PubSub } = require('apollo-server');


const schema = gql`
    type LiveStreamTestStats {
        likes: Int
        viewers: Int
    }

    extend type Subscription {
        liveStreamStats: LiveStreamTestStats
    }
`;

module.exports.typeDefs = [schema];


const pubsub = new PubSub();

function runRandDelay(delayMs) {
  setTimeout(() => {
    const data = {
      likes: Math.ceil(Math.random() * 100),
      viewers: Math.ceil(Math.random() * 150),
    };
    pubsub.publish('TEST_STATS', { liveStreamStats: data });
    runRandDelay(Math.ceil(Math.random() * 1000) + 4000);
  }, delayMs);
}

runRandDelay(1000);

module.exports.resolvers = {
  Subscription: {
    liveStreamStats: {
      subscribe: () => pubsub.asyncIterator(['TEST_STATS']),
    },
  },
};
