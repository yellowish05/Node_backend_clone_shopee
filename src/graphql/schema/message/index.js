const { gql, withFilter } = require('apollo-server');
const { MessageType } = require('../../../lib/Enums');

const pubsub = require('../common/pubsub');


const addMessage = require('./resolvers/addMessage');

const schema = gql`
    enum MessageSortFeature {
      CREATED_AT
    }

    enum MessageTypeEnum {
      ${MessageType.toGQL()}
    }

    input MessageSortInput {
      feature: MessageSortFeature! = CREATED_AT
      type: SortTypeEnum! = DESC
    }
    
    input MessageInput {
      thread: ID!
      type: MessageTypeEnum!
      data: String!
    }

    type Message {
      id: ID!
      thread: MessageThread!
      author: User!
      type: MessageTypeEnum!
      data: String!
      createdAt: Date!
    }

    type MessageThread {
      id: ID!
      tags: [String]!
      participants: [User!]!
      messages(limit: Int! = 10, sort: MessageSortInput = {}): [Message]!
    }

    extend type Query {
      messages(thread: ID!, skip: Date, limit: Int! = 10, sort: MessageSortInput = {}): [Message]! @auth(requires: USER)
    }

    extend type Mutation {
      addMessage(input: MessageInput!): Message! @auth(requires: USER)
    }

    extend type Subscription {
      messageAdded(threads: [ID!], threadTags: [String!]): Message! 
    }

`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    messages(_, args, { dataSources: { repository } }) {
      return repository.message.get(args);
    },
  },
  Mutation: {
    addMessage,
  },
  Subscription: {
    messageAdded: {
      resolve: (payload) => payload,
      subscribe: withFilter(
        () => pubsub.asyncIterator(['MESSAGE_ADDED']),
        ({ thread }, { threads, threadTags }) => {
          if (threads && threads.length) {
            if (threads.includes(thread.id)) {
              return true;
            }
          }

          if (threadTags && threadTags.length && thread.tags.length) {
            return thread.tags.reduce((acc, tag) => (acc || threadTags.includes(tag)), false);
          }

          return false;
        },
      ),
    },
  },
  Message: {
    thread(message, _, { dataSources: { repository } }) {
      return repository.messageThread.load(message.thread);
    },
    author(message, _, { dataSources: { repository } }) {
      return repository.user.load(message.author);
    },
  },
  MessageThread: {
    participants(thread, _, { dataSources: { repository } }) {
      return repository.user.loadList(thread.participants);
    },
    messages(thread, { limit, sort }, { dataSources: { repository } }) {
      return repository.message.get({ thread, limit, sort });
    },
  },
};
