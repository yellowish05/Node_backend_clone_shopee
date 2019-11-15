const path = require('path');
const { gql, withFilter } = require('apollo-server');

const { MessageType } = require(path.resolve('src/lib/Enums'));

const pubsub = require(path.resolve('src/graphql/schema/common/pubsub'));


const addMessage = require('./resolvers/addMessage');
const markMessageThreadReadBy = require('./resolvers/markMessageThreadReadBy');

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
      isRead: Boolean
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
      markMessageThreadReadBy(thread: ID!, time: Date!): MessageThread! @auth(requires: USER)
    }

    extend type Subscription {
      messageAdded(threads: [ID!], threadTags: [String!]): Message! @auth(requires: USER)
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
    markMessageThreadReadBy,
  },
  Subscription: {
    messageAdded: {
      resolve: (payload) => payload,
      subscribe: withFilter(
        () => pubsub.asyncIterator(['MESSAGE_ADDED']),
        ({ thread }, { threads, threadTags }, { user }) => {
          if (!thread.participants.includes(user.id)) {
            return false;
          }

          if (threads || threadTags) {
            if (threads && threads.length) {
              if (threads.includes(thread.id)) {
                return true;
              }
            }

            if (threadTags && threadTags.length && thread.tags.length) {
              return thread.tags.reduce((acc, tag) => (acc || threadTags.includes(tag)), false);
            }

            return false;
          }

          return true;
        },
      ),
    },
  },
  Message: {
    thread(message, _, { dataSources: { repository } }) {
      return repository.messageThread.findOne(message.thread);
    },
    author(message, _, { dataSources: { repository } }) {
      return repository.user.load(message.author);
    },
    isRead(message, _, { dataSources: { repository }, user }) {
      if (!user) {
        return null;
      }
      return repository.userHasMessageThread.findOne(message.thread, user.id).then(
        (threadRead) => (threadRead ? message.createdAt.getTime() <= threadRead.readBy.getTime() : false),
      );
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
