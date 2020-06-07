const path = require('path');
const { gql, withFilter } = require('apollo-server');

const addLiveStream = require('./resolvers/addLiveStream');
const likeLiveStream = require('./resolvers/likeLiveStream');
const archiveLiveStream = require('./resolvers/archiveLiveStream');
const joinLiveStream = require('./resolvers/joinLiveStream');
const leaveLiveStream = require('./resolvers/leaveLiveStream');
const getLiveStreamCollection = require('./resolvers/getLiveStreamCollection');
const getLiveStreamDuration = require('./resolvers/getLiveStreamDuration');
const addProductToLiveStream = require('./resolvers/addProductToLiveStream');
const removeProductFromLiveStream = require('./resolvers/removeProductFromLiveStream');
const updateLiveStreamCount = require('./resolvers/updateLiveStreamCount');

const pubsub = require(path.resolve('config/pubsub'));

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
        isLiked: Boolean
        statistics: LiveStreamStats!
        publicMessageThread: MessageThread
        privateMessageThreads: [MessageThread]!
        products: [Product]!
        views: Int!
        likes: Int!
    }

    input LiveStreamInput {
        title: String!
        experience: ID!
        categories: [ID]!
        city: String
        preview: ID
        products: [ID] = []

    }

    type LiveStreamCollection {
      collection: [LiveStream]!
      pager: Pager
    }

    input LiveStreamFilterInput {
      """
      Searching by Title of the Live Stream.
      Will return live streams if the query full matched inside title
      """
      searchQuery: String
      experiences: [ID] = []
      categories: [ID] = []
      cities: [ID] = []
      statuses: [StreamChannelStatus] = []
      """
      You can use it for fetch live streams by specific Streamer
      """
      streamers: [ID!] = []
    }

    enum LiveStreamSortFeature {
      CREATED_AT
    }

    input LiveStreamSortInput {
      feature: LiveStreamSortFeature! = CREATED_AT
      type: SortTypeEnum! = ASC
    }

    input LiveStreamUpdateInput {
      id: ID!
      playLength: Int!
      view: String!
      tag: String!
    }

    extend type Query {
        liveStreams(filter: LiveStreamFilterInput = {}, page: PageInput = {}, sort: LiveStreamSortInput = {}): LiveStreamCollection!
        liveStream(id: ID!): LiveStream
    }
  
    extend type Mutation {
      """Allows: authorized user"""
      addLiveStream(data: LiveStreamInput!): LiveStream! @auth(requires: USER)

      """Allows: authorized user"""
      likeLiveStream(id: ID!): LiveStream! @auth(requires: USER)

      """Allows: authorized user"""
      archiveLiveStream(id: ID!): LiveStream! @auth(requires: USER)
      
      """
      Allows: authorized user
      When user join LiveStream next things executed:
      1. StreamChannel Token generation for this User and LiveStream
      2. Created MessageThread for User and Streamer
      Pass ID of the Live Stream
      """
      joinLiveStream(id: ID!): LiveStream! @auth(requires: USER)

      """
      Allows: authorized user
      Pass ID of the Live Stream
      """
      leaveLiveStream(id: ID!): Boolean! @auth(requires: USER)
      """
      Allows: authorized user
      Pass ID of the Live Stream and list of Product IDs. Make sure to set Error Policy to 'all'
      """
      addProductToLiveStream(liveStream: ID!, productIds: [ID]!): LiveStream! @auth(requires: USER)
      """
      Allows: authorized user
      Pass ID of the Live Stream and ID of the Product
      """
      removeProductFromLiveStream(liveStream: ID!, productId: ID!): LiveStream! @auth(requires: USER)
      updateLiveStreamCount(data: LiveStreamUpdateInput): LiveStream!
    }

    extend type Subscription {
      """Allows: authorized user"""
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
    archiveLiveStream,
    joinLiveStream,
    leaveLiveStream,
    addProductToLiveStream,
    removeProductFromLiveStream,
    updateLiveStreamCount,
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
      if (!user) {
        return null;
      }
      return repository.like.load(`LiveStream:${liveStream.id}`, user.id).then((like) => !!like);
    },
    statistics(liveStream) {
      return liveStream;
    },
    /**
      Any user allows receive Public Thread
    */
    publicMessageThread(liveStream, _, { dataSources: { repository }, user }) {
      if (!user) {
        return null;
      }
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
      if (!user) {
        return [];
      }
      if (user.id === liveStream.streamer) {
        return repository.messageThread.findByIds(liveStream.privateMessageThreads);
      }

      return repository.messageThread.findByIdsAndParticipants(
        liveStream.privateMessageThreads,
        [user, liveStream.streamer],
      )
        .then((thread) => (!thread ? [] : [thread]));
    },
    products(liveStream, _, { dataSources: { repository } }) {
      return repository.product.getByIds(liveStream.products);
    },
    views(liveStream, _, { dataSources: { repository } }) {
      return repository.liveStream.getViews(liveStream.id);
    },
    likes(liveStream, _, { dataSources: { repository } }) {
      return repository.liveStream.getLikes(liveStream.id);
    },
  },
  LiveStreamStats: {
    duration: getLiveStreamDuration,
    likes(liveStream, args, { dataSources: { repository } }) {
      return repository.like.getLikesCount(`LiveStream:${liveStream.id}`);
    },
    viewers(liveStream, args, { dataSources: { repository } }) {
      return repository.streamChannelParticipant.getViewersCount(liveStream.channel);
    },
  },
};
