const { gql } = require('apollo-server');

const schema = gql`
    type LiveStreamExperience {
        id: ID!
        name(locale: LOCALE): String!
        description(locale: LOCALE): String!
        image: String
    }

    extend type Query {
        liveStreamExperiences: [LiveStreamExperience]!
        liveStreamExperience(id: ID!): LiveStreamExperience
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    liveStreamExperience(_, { id }, { dataSources: { repository } }) {
      return repository.liveStreamExperience.getById(id);
    },
    liveStreamExperiences(_, args, { dataSources: { repository } }) {
      return repository.liveStreamExperience.getAll();
    },
  },
};
