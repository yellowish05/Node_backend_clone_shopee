const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { StreamChannelStatus, SourceType } = require(path.resolve('src/lib/Enums'));
const { AgoraService } = require(path.resolve('src/lib/AgoraService'));
const logger = require(path.resolve('config/logger'));
const pubsub = require(path.resolve('config/pubsub'));

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
        throw new UserInputError(`Stream Channel ${args.data.experience} does not exist`, { invalidArgs: 'id' });
      }

      if (streamChannel.status === StreamChannelStatus.FINISHED) {
        throw new ApolloError('Stream is already finished', 400);
      }

      if (streamChannel.status === StreamChannelStatus.PENDING) {
        throw new ApolloError('You can finish only started stream', 400);
      }
      return repository.streamChannelParticipant.load(args.id, user.id)
        .then((participant) => {
          if (!participant.isPublisher) {
            throw new ForbiddenError('Only streamer can stop the stream', 403);
          }

          return repository.streamChannel.finish(args.id);
        })
        .then((channel) => {
          if (channel.record.enabled) {
            AgoraService.recording.stop(args.id, '1', streamChannel.record.resourceId, streamChannel.record.sid)
              .then(({ serverResponse }) => repository.streamSource.create({
                source: `/${serverResponse.fileList}`,
                type: SourceType.VIDEO_AUDIO,
                user,
              }))
              .then((sources) => repository.streamChannel.finishRecording(args.id, sources))
              .catch((error) => {
                logger.error(`Failed to stop record StreamChannel(${args.id}). Original error: ${error}`);
                repository.streamChannel.failRecording(args.id);
              });
          }

          repository.liveStream.getOne({ channel: args.id }).then((liveStream) => {
            liveStream.status = StreamChannelStatus.FINISHED;
            liveStream.save();
            pubsub.publish('LIVE_STREAM_CHANGE', liveStream);
          });
          return channel;
        });
    });
};
