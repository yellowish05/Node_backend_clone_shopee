const { gql } = require('apollo-server');

const addLiveStream = require('./resolvers/addLiveStream');

const schema = gql`
    type LiveStream {
        id: ID!
        title: String!
        streamer: User!
        viewers: [User]!
        experience: LiveStreamExperience!
        categories: [LiveStreamCategory]!
        preview: Asset!
        startAt: Date
        finishAt: Date
    }

    input LiveStreamInput {
        title: String!
        experience: ID!
        categories: [ID]!
        preview: ID!
    }

    extend type Query {
        liveStreams: [LiveStream]!
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
    liveStreams(_, args, { dataSources: { repository } }) {
      return repository.liveStream.getAll();
    },
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
  },
};
