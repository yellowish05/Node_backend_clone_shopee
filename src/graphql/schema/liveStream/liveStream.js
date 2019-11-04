const { gql, withFilter } = require('apollo-server');

const addLiveStream = require('./resolvers/addLiveStream');
const likeLiveStream = require('./resolvers/likeLiveStream');
const getLiveStreamCollection = require('./resolvers/getLiveStreamCollection');
const getLiveStreamDuration = require('./resolvers/getLiveStreamDuration');

const pubsub = require('../common/pubsub');

const schema = gql`
    type LiveStreamStats {
      duration: Int
      likes: Int
      viewers: Int
    }

    type LiveStream {
        id: ID!
        title: String!
        streamer: User!
        experience: LiveStreamExperience!
        categories: [LiveStreamCategory]!
        preview: Asset
        channel: StreamChannel!
        isLiked: Boolean! @auth(requires: USER)
        statistics: LiveStreamStats!
    }

    input LiveStreamInput {
        title: String!
        experience: ID!
        categories: [ID]!
        preview: ID
    }

    type LiveStreamCollection {
      collection: [LiveStream]!
      pager: Pager
    }

    input LiveStreamFilterInput {
      experiences: [ID] = []
      categories: [ID] = []
      cities: [ID] = []
      statuses: [StreamChannelStatus] = []
    }

    enum LiveStreamSortFeature {
      CREATED_AT
    }

    input LiveStreamSortInput {
      feature: LiveStreamSortFeature! = CREATED_AT
      type: SortTypeEnum! = ASC
    }

    extend type Query {
        liveStreams(filter: LiveStreamFilterInput = {}, page: PageInput = {}, sort: LiveStreamSortInput = {}): LiveStreamCollection!
        liveStream(id: ID!): LiveStream
    }
  
    extend type Mutation {
      addLiveStream(data: LiveStreamInput!): LiveStream! @auth(requires: USER)
      likeLiveStream(id: ID!): LiveStream! @auth(requires: USER)
    }

    extend type Subscription {
      liveStream(id: ID!): LiveStream
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    liveStream(_, { id }, { dataSources: { repository } }) {
      return repository.liveStream.load(id);
    },
    liveStreams: getLiveStreamCollection,
  },
  Mutation: {
    addLiveStream,
    likeLiveStream,
  },
  Subscription: {
    liveStream: {
      resolve: (payload) => payload,
      subscribe: withFilter(
        () => pubsub.asyncIterator(['LIVE_STREAM_CHANGE']),
        (payload, variables) => payload.id === variables.id,
      ),
    },
  },
  LiveStream: {
    experience(liveStream, args, { dataSources: { repository } }) {
      return repository.liveStreamExperience.getById(liveStream.experience);
    },
    categories(liveStream, args, { dataSources: { repository } }) {
      return liveStream.categories.map(
        (category) => repository.liveStreamCategory.getById(category),
      );
    },
    preview(liveStream, args, { dataSources: { repository } }) {
      return repository.asset.load(liveStream.preview);
    },
    streamer(liveStream, args, { dataSources: { repository } }) {
      return repository.user.load(liveStream.streamer);
    },
    channel(liveStream, args, { dataSources: { repository } }) {
      return repository.streamChannel.load(liveStream.channel);
    },
    isLiked(liveStream, args, { user, dataSources: { repository } }) {
      return repository.like.load(liveStream.id, user.id).then((like) => !!like);
    },
    statistics(liveStream) {
      return liveStream;
    },
  },
  LiveStreamStats: {
    duration: getLiveStreamDuration,
    likes(liveStream, args, { dataSources: { repository } }) {
      return repository.like.getLikesCount(liveStream.id);
    },
    viewers(liveStream, args, { dataSources: { repository } }) {
      return repository.streamChannelParticipant.getViewersCount(liveStream.channel);
    },
  },
};
