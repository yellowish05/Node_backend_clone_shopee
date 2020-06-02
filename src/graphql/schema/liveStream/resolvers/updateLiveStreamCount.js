const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const pubsub = require(path.resolve('config/pubsub'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args,
    { id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] });

  const { data } = args;
  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.liveStream.updateCount(data.id, data.playLength, data.tag, data.view))
    .then(() => repository.liveStream.load(data.id))
    .then((liveStream) => {
      pubsub.publish('LIVE_STREAM_CHANGE', { id: liveStream._id, ...liveStream.toObject() });
      return liveStream;
    });
};
