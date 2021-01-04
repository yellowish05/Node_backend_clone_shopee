const path = require('path');
const { gql } = require('apollo-server');

const { cdn } = require(path.resolve('config'));

const schema = gql`
    type LiveStreamCategory {
        id: ID!
        name(locale: Locale): String!
        image: String
        hashtags: [String]
        slug: String
    }

    extend type Query {
        liveStreamCategories: [LiveStreamCategory]!
        liveStreamCategory(id: ID!): LiveStreamCategory
        liveStreamCategoryBySlug(slug: String!): LiveStreamCategory
    }

`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    liveStreamCategory(_, { id }, { dataSources: { repository } }) {
      return repository.liveStreamCategory.getById(id);
    },
    liveStreamCategories(_, args, { dataSources: { repository } }) {
      return repository.liveStreamCategory.getAll();
    },
    liveStreamCategoryBySlug(_, { slug }, {dataSources: { repository } }) {
      return repository.liveStreamCategory.getBySlug(slug);
    },
  },
  LiveStreamCategory: {
    image: async (liveStreamCategory) => `${cdn.appAssets}${liveStreamCategory.imagePath}`,
  },
};
