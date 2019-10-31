const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');
const { ErrorHandler } = require('../../../../lib/ErrorHandler');
const { StreamChannelStatus } = require('../../../../lib/Enums');

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {
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

      const finishedAt = Date.now();

      return repository.liveStream.getOne({ channel: args.id })
        .then((liveStream) => repository.liveStream.update(liveStream._id, {
          statistics: {
            ...liveStream.statistics,
            duration: Math.floor((finishedAt - streamChannel.startedAt.getTime()) / 1000),
          },
        })).then(() => repository.streamChannel.update(args.id, {
          status: StreamChannelStatus.FINISHED,
          finishedAt,
        }));
    });
};
