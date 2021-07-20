const { gql } = require('apollo-server');

const schema = gql`
  type LiveStreamExperience {
    id: ID!
    name(language: LanguageList): String!
    description(language: LanguageList): String!
    image: String
    hashtags: [String]
  }

  extend type Query {
    liveStreamExperiences(hasStream: Boolean = true): [LiveStreamExperience]!
    liveStreamExperience(id: ID!): LiveStreamExperience
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    liveStreamExperience(_, { id }, { dataSources: { repository } }) {
      return repository.liveStreamExperience.getById(id);
    },
    liveStreamExperiences(_, { hasStream }, { dataSources: { repository } }) {
      const query = {};
      if (typeof hasStream === 'boolean' && hasStream === true) {
        query.$or = [{"nStreams.streaming": {$gt: 0}}, {"nStreams.finished": {$gt: 0}}];
      } else if (typeof hasStream === 'boolean' && hasStream === false) {
        query.$and = [{"nStreams.streaming": {$eq: 0}}, {"nStreams.finished": {$eq: 0}}];
      }
      return repository.liveStreamExperience.getAll(query);
    },
  },
  LiveStreamExperience: {
    name: ({ name, translations }, { language }) => translations.name[language] || name,
    description: ({ description, translations }, { language }) => translations.description[language] || description,
  },
};
