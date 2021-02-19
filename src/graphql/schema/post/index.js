const path = require('path');
const { gql } = require('apollo-server');

const addPost = require('./resolvers/addPost');
const postAdded = require('./resolvers/postAdded');

const schema = gql`
  type Post {
    title: String
    feed: String!
    user: User!
    tags: [String]
    assets: [Asset]
    streams: [LiveStream]
  }

  input PostAddInput {
    title: String
    feed: String!
    tags: [String] = []
    assets: [ID] = []
    streams: [ID] = []
  }

  # extend type Query {

  # }

  extend type Mutation {
    addPost(data: PostAddInput!): Post @auth(requires: USER)
  }

  extend type Subscription {
    postAdded: Post! @auth(requires: USER)
  }

`

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  // Query: {

  // },
  Mutation: {
    addPost,
  },
  Subscription: {
    postAdded,
  },
  Post: {
    user: async ({ user }, __, { dataSources: { repository }}) => repository.user.getById(user),
    assets: async ({ assets }, __, { dataSources: { repository }}) => repository.asset.getByIds(assets),
    streams: async ({ streams }, __, { dataSources: { repository }}) => repository.liveStream.getByIds(streams),
  },
}


