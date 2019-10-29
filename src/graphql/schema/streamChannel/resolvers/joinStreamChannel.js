const uuid = require('uuid/v4');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');
const { ErrorHandler } = require('../../../../lib/ErrorHandler');
const { AgoraService } = require('../../../../lib/AgoraService');
const { StreamRole } = require('../../../../lib/Enums');

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

      if (!user) {
        return repository.streamChannelParticipant.load(args.id, null)
          .then((anonimuseParticipant) => {
            if (anonimuseParticipant) {
              return streamChannel;
            }
            const token = AgoraService.buildTokenWithAccount(streamChannel._id, 'guest', StreamRole.SUBSCRIBER);
            return repository.streamChannelParticipant.create({
              _id: uuid(),
              channel: args.id,
              token,
              user: null,
              isPublisher: false,
            }).then(() => repository.liveStream.getOne({ channel: args.id })
              .then((liveStream) => repository.liveStream.update(liveStream._id, {
                statistics: { ...liveStream.statistics, viewers: liveStream.statistics.viewers + 1 },
              })).then(() => streamChannel));
          });
      }

      return repository.streamChannelParticipant.getActiveChannelParticipants(user._id)
        .then((channels) => Promise.all(
          channels.map((c) => repository.streamChannelParticipant.leaveStream(c.id, user._id)),
        )).then(() => {
          const token = AgoraService.buildTokenWithAccount(streamChannel._id, user._id, StreamRole.SUBSCRIBER);

          return repository.streamChannelParticipant.create({
            _id: uuid(),
            channel: args.id,
            token,
            user,
            isPublisher: false,
          }).then(() => repository.liveStream.getOne({ channel: args.id })
            .then((liveStream) => repository.liveStream.update(liveStream._id, {
              statistics: { ...liveStream.statistics, viewers: liveStream.statistics.viewers + 1 },
            })).then(() => streamChannel));
        });
    });
};
