const path = require('path');
const { gql, withFilter } = require('apollo-server');

const addLiveStream = require('./resolvers/addLiveStream');
const likeLiveStream = require('./resolvers/likeLiveStream');
const joinLiveStream = require('./resolvers/joinLiveStream');
const leaveLiveStream = require('./resolvers/leaveLiveStream');
const getLiveStreamCollection = require('./resolvers/getLiveStreamCollection');
const getLiveStreamDuration = require('./resolvers/getLiveStreamDuration');

const pubsub = require(path.resolve('src/graphql/schema/common/pubsub'));

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
        city: City
        preview: Asset
        channel: StreamChannel!
        isLiked: Boolean! @auth(requires: USER)
        statistics: LiveStreamStats!
        publicMessageThread: MessageThread!
        privateMessageThreads: [MessageThread]!
    }

    input LiveStreamInput {
        title: String!
        experience: ID!
        categories: [ID]!
        city: String
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
      
      """
      When user join LiveStream next things executed:
      1. StreamChannel Token generation for this User and LiveStream
      2. Created MessageThread for User and Streamer
      Pass ID of the Live Stream
      """
      joinLiveStream(id: ID!): LiveStream! @auth(requires: USER)

      """
      Pass ID of the Live Stream
      """
      leaveLiveStream(id: ID!): Boolean! @auth(requires: USER)
    }

    extend type Subscription {
      liveStream(id: ID!): LiveStream @auth(requires: USER)
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
    joinLiveStream,
    leaveLiveStream,
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
    city(liveStream, args, { dataSources: { repository } }) {
      return repository.city.load(liveStream.city);
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
    /**
      Any user allows receive Public Thread
    */
    publicMessageThread(liveStream, _, { dataSources: { repository } }) {
      if (typeof liveStream.publicMessageThread === 'object') {
        return liveStream.publicMessageThread;
      }
      return repository.messageThread.findOne(liveStream.publicMessageThread);
    },
    /**
      User allows receive all private threads if he is a Streamer.
      Overwise User receive only private one thread with Streamer.
    */
    privateMessageThreads(liveStream, _, { dataSources: { repository }, user }) {
      if (user.id === liveStream.streamer) {
        return repository.messageThread.findByIds(liveStream.privateMessageThreads);
      }

      return repository.messageThread.findByIdsAndParticipants(
        liveStream.privateMessageThreads,
        [user, liveStream.streamer],
      )
        .then((thread) => (!thread ? [] : [thread]));
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
