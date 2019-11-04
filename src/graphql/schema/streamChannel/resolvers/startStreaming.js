const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');
const { ErrorHandler } = require('../../../../lib/ErrorHandler');
const { StreamChannelStatus } = require('../../../../lib/Enums');
const pubsub = require('../../common/pubsub');

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { user, dataSources: { repository } }) => {
  const validator = new Validator(args, {
    id: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.streamChannel.load(args.id))
    .then((streamChannel) => {
      if (!streamChannel) {
        throw new UserInputError(`Stream Channel ${args.id} does not exist`, { invalidArgs: 'id' });
      }

      if (streamChannel.status === StreamChannelStatus.STREAMING) {
        throw new ApolloError('Stream is already started', 400);
      }

      if (streamChannel.status === StreamChannelStatus.FINISHED) {
        throw new ApolloError('You cannot start finished stream', 400);
      }
    })
    .then(() => repository.streamChannelParticipant.load(args.id, user.id))
    .then((participant) => {
      if (!participant.isPublisher) {
        throw new ApolloError('Only streamer can start the stream', 403);
      }

      return repository.streamChannel.start(args.id)
        .then((channel) => {
          repository.liveStream.getOne({ channel: args.id }).then((liveStream) => {
            liveStream.status = StreamChannelStatus.STREAMING;
            liveStream.save();
            pubsub.publish('LIVE_STREAM_CHANGE', liveStream);
          });
          return channel;
        });
    });
};
