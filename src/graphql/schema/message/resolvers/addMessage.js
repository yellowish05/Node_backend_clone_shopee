const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ForbiddenError } = require('apollo-server');

const { MessageType, NotificationType } = require(path.resolve('src/lib/Enums'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const NotificationService = require(path.resolve('src/lib/NotificationService'));
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

      return repository.messageThread.updateTime(thread.id);
    })
    .then((thread) => Promise.all([repository.message
      .addMessage({
        author: user.id,
        thread: thread.id,
        type: input.type,
        data: input.data,
      }),
    repository.userHasMessageThread.updateTime(thread.id, user.id, Date.now()),
    ])
      .then(([message, userThread]) => {
        if (!userThread.muted && !userThread.hidden) {
          pubsub.publish('MESSAGE_ADDED', {
            ...message.toObject(),
            id: message.id,
            thread: { ...thread.toObject(), id: thread.id },
          });

          // var message = user.name + ' has messaged you';            // 10-06
          // var device_ids = [];                                      // 10-06
          // TODO: we need to add queue here
          repository.user.loadList(thread.participants)
            .then(async (participants) => Promise.all(participants.map((participant) => {
              if (participant._id !== user.id && !participant.blackList.includes(user.id)) {
                // if (participant.device_id != '' && participant.device_id != undefined)    // 10-06
                //   notifi_ids.push(participant.device_id);       // 10-06
                repository.notification.create({
                  type: NotificationType.MESSAGE,
                  user: participant._id,
                  data: {
                    text: message.data,
                    author: user.id,
                  },
                  tags: ['Message:message.id'],
                }).then((notification) => {
                  NotificationService.pushNotification({ user: participant, notification });
                });
              }
            })))
            // 10-06
            // .then(() => {
            //   NotificationService.sendPushNotification({ message, device_ids });
            // })
            .catch((error) => {
              logger.error(`Failed to create Notification on Add Message for user "${uId}", Original error: ${error}`);
            });
        }

        return message;
      }));
};
