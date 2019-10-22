const { gql } = require('apollo-server');

const addLiveStream = require('./resolvers/addLiveStream');

function populateLiveStream(liveStream, repository) {
  const liveStreamObject = liveStream.toObject();
  liveStreamObject.experience = repository.liveStreamExperience.getById(liveStream.experience);
  liveStreamObject.categories = liveStream.categories.map(
    (category) => repository.liveStreamCategory.getById(category),
  );
  return liveStreamObject;
}

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
    liveStream: async (_, { id }, { dataSources: { repository } }) => {
      const liveStream = await repository.liveStream.getById(id);
      return populateLiveStream(liveStream, repository);
    },
    liveStreams: async (_, args, { dataSources: { repository } }) => {
      const liveStreams = await repository.liveStream.getAll();
      return liveStreams.map((liveStream) => populateLiveStream(liveStream, repository));
    },
  },
  Mutation: {
    addLiveStream,
  },
};
