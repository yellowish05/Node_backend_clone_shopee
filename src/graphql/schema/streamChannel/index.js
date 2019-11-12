const { gql } = require('apollo-server');
const { StreamChannelType, StreamRecordStatus, StreamChannelStatus } = require('../../../lib/Enums');
const joinStreamChannel = require('./resolvers/joinStreamChannel');
const leaveStreamChannel = require('./resolvers/leaveStreamChannel');
const startStreaming = require('./resolvers/startStreaming');
const stopStreaming = require('./resolvers/stopStreaming');

const schema = gql`
    enum StreamChannelType {
      ${StreamChannelType.toGQL()}
    }

    enum StreamRecordStatus {
      ${StreamRecordStatus.toGQL()}
    }

    enum StreamChannelStatus {
      ${StreamChannelStatus.toGQL()}
    }

    type StreamRecordSource {
      user: User!
      source: String!
    }

    type StreamRecord {
      enabled: Boolean!
      status: StreamRecordStatus!
      sources: [StreamRecordSource]!
    }

    type StreamParticipant {
      joinedAt: Date
      leavedAt: Date
      user: User
      isPublisher: Boolean!
    }

    type StreamChannel {
      """Think about it as about channel name"""
      id: ID!

      type: StreamChannelType

      status: StreamChannelStatus!
      
      """Token is a personal for logged user, or one for all guests"""
      token: String
      
      participants: [StreamParticipant]! 
      
      record: StreamRecord

      startedAt: Date

      finishedAt: Date
    }

    extend type Query {
      streamChannel(id: ID!): StreamChannel!
    }
  
    extend type Mutation {
        """
        When user try join the API generates token for this user and channel
        Pass ID of the Stream Channel created for Live Stream
        """
        joinStreamChannel(id: ID!): StreamChannel! @deprecated(reason: "Use 'joinLiveStream' instead")

        """
        Pass ID of the Stream Channel created for Live Stream
        """
        leaveStreamChannel(id: ID!): Boolean! @deprecated(reason: "Use 'leaveLiveStream' instead")

        """
        Pass ID of the Stream Channel created for Live Stream
        """
        startStreaming(id: ID!): StreamChannel! @auth(requires: USER)

        """
        Pass ID of the Stream Channel created for Live Stream
        """
        stopStreaming(id: ID!): StreamChannel! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    streamChannel(_, args, { dataSources: { repository } }) {
      return repository.streamChannel.load(args.id);
    },
  },
  Mutation: {
    joinStreamChannel,
    leaveStreamChannel,
    startStreaming,
    stopStreaming,
  },
  StreamChannel: {
    participants(streamChannel, args, { dataSources: { repository } }) {
      return repository.streamChannelParticipant.getChannelParticipants(streamChannel.id);
    },
    token(streamChannel, args, { user, dataSources: { repository } }) {
      return repository.streamChannelParticipant.load(streamChannel.id, user ? user.id : null)
        .then((paticipant) => (paticipant ? paticipant.token : null));
    },
  },
  StreamParticipant: {
    user(participant, args, { dataSources: { repository } }) {
      return participant.user == null ? null : repository.user.load(participant.user);
    },
  },
};
