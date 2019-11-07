const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');
const { MessageType } = require('../../../../lib/Enums');
const { ErrorHandler } = require('../../../../lib/ErrorHandler');
const pubsub = require('../../common/pubsub');

const errorHandler = new ErrorHandler();

module.exports = (_, { input }, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    input,
    { thread: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { type: ['required', `in:${MessageType.toList().join(',')}`] },
    { data: ['required', 'minLengh:1'] },
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.messageThread.load(input.thread))
    .then((thread) => {
      if (!thread) {
        throw new UserInputError('Thread does not exist', { invalidArgs: 'thread' });
      }

      return repository.message
        .addMessage({
          author: user.id,
          thread: thread.id,
          type: input.type,
          data: input.data,
        })
        .then((message) => {
          pubsub.publish('MESSAGE_ADDED', {
            ...message.toObject(),
            id: message.id,
            thread: { ...thread.toObject(), id: thread.id },
          });
          return message;
        });
    });
};
