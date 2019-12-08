const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ForbiddenError } = require('apollo-server');

const { MessageType, NotificationType } = require(path.resolve('src/lib/Enums'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const logger = require(path.resolve('config/logger'));
const pubsub = require(path.resolve('config/pubsub'));

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
    .then(() => repository.messageThread.findOne(input.thread))
    .then((thread) => {
      if (!thread) {
        throw new UserInputError('Thread does not exist', { invalidArgs: 'thread' });
      }

      if (!thread.participants.includes(user.id)) {
        throw new ForbiddenError('You can not write to this thread');
      }

      return Promise.all([repository.message
        .addMessage({
          author: user.id,
          thread: thread.id,
          type: input.type,
          data: input.data,
        }),
      repository.userHasMessageThread.updateTime(thread.id, user.id, Date.now()),
      ])
        .then(([message, _]) => {
          pubsub.publish('MESSAGE_ADDED', {
            ...message.toObject(),
            id: message.id,
            thread: { ...thread.toObject(), id: thread.id },
          });

          // TODO: we need to add queue here
          repository.user.loadList(thread.participants)
            .then((participants) => {
              participants.forEach(({ id, blackList }) => {
                if (id !== user.id && !blackList.includes(user.id)) {
                  repository.notification.create({
                    type: NotificationType.MESSAGE,
                    user: id,
                    data: {
                      text: message.data,
                      author: user.id,
                    },
                    tags: ['Message:message.id'],
                  });
                }
              });
            })
            .catch((error) => {
              logger.error(`Failed to create Notification on Add Message for user "${uId}", Original error: ${error}`);
            });

          return message;
        });
    });
};
