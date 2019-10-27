const { gql } = require('apollo-server');

const addLiveStream = require('./resolvers/addLiveStream');
const getLiveStreamCollection = require('./resolvers/getLiveStreamCollection');

const schema = gql`
    type LiveStream {
        id: ID!
        title: String!
        streamer: User!
        viewers: [User]!
        experience: LiveStreamExperience!
        categories: [LiveStreamCategory]!
        preview: Asset
        startAt: Date
        finishAt: Date
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
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    liveStream(_, { id }, { dataSources: { repository } }) {
      return repository.liveStream.getById(id);
    },
    liveStreams: getLiveStreamCollection,
  },
  Mutation: {
    addLiveStream,
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
  },
};
