const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');
const { ErrorHandler } = require('../../../../lib/ErrorHandler');
const { AgoraService } = require('../../../../lib/AgoraService');
const { StreamRole } = require('../../../../lib/Enums');
const pubsub = require('../../common/pubsub');

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
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

      return repository.streamChannelParticipant.load(args.id, user ? user._id : null)
        .then((existingParticipant) => {
          if (existingParticipant) {
            return streamChannel;
          }

          return (user ? repository.streamChannelParticipant.getActiveChannelParticipants(user._id) : Promise.resolve([]))
            .then((channels) => {
              channels.forEach((c) => repository.streamChannelParticipant.leaveStream(c.id, user._id));

              const token = AgoraService.buildTokenWithAccount(streamChannel._id, user ? user._id : 'guest', StreamRole.SUBSCRIBER);

              return repository.streamChannelParticipant.create({
                channel: args.id,
                token,
                user: user ? user._id : null,
                isPublisher: false,
              })
                .then(() => {
                  repository.liveStream.load(args.id).then((liveStream) => {
                    pubsub.publish('LIVE_STREAM_CHANGE', liveStream);
                  });
                  return streamChannel;
                });
            });
        });
    });
};
