const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
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
    .then(() => repository.like.toggleLike(`LiveStream:${args.id}`, user.id))
    .then(() => repository.liveStream.load(args.id))
    .then((liveStream) => {
      pubsub.publish('LIVE_STREAM_CHANGE', { id: liveStream._id, ...liveStream.toObject() });
      return liveStream;
    });
};
