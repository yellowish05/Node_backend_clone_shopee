const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');
const { ErrorHandler } = require('../../../../lib/ErrorHandler');
const pubsub = require('../../common/pubsub');

const errorHandler = new ErrorHandler();

const activity = {
  async checkIfLiveStreamExist(id, repository) {
    return repository.liveStream.load(id)
      .then((liveStream) => {
        if (!liveStream) {
          throw new UserInputError(`Live Stream "${id}" does not exist`, { invalidArgs: 'id' });
        }
        return liveStream;
      });
  },
};

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    args,
    { id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => activity.checkIfLiveStreamExist(args.id, repository))
    .then((liveStream) => (
      repository.streamChannelParticipant
        .leaveStream(liveStream.channel, user.id)
        .then(() => {
          pubsub.publish('LIVE_STREAM_CHANGE', liveStream);
          return true;
        })
    ));
};
