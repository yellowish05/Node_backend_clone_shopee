const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { AgoraService } = require(path.resolve('src/lib/AgoraService'));
const { StreamRole } = require(path.resolve('src/lib/Enums'));
const pubsub = require(path.resolve('src/graphql/schema/common/pubsub'));

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

  async quitFromActiveChannels({ userId }, repository) {
    return repository.streamChannelParticipant
      .getParticipantActiveChannels(userId)
      .then((channels) => channels.map(({ channelId }) => (
        repository.streamChannelParticipant.leaveStream(channelId, userId)
      )));
  },

  async createChannelParticipant({ liveStream, user }, repository) {
    return repository.streamChannelParticipant.create({
      channel: liveStream.channel,
      token: AgoraService.buildTokenWithAccount(liveStream.channel, user.id, StreamRole.SUBSCRIBER),
      user,
      isPublisher: false,
    });
  },

  async createPrivateMessageThread({ liveStream, user }, repository) {
    const threadTag = `LiveStream:${liveStream.id}`;
    return repository.messageThread
      .findByIdsAndParticipants(liveStream.privateMessageThreads, [liveStream.streamer, user.id])
      .then((thread) => {
        if (thread) {
          return thread;
        }

        return repository.messageThread.create({
          participants: [liveStream.streamer, user.id],
          tags: [threadTag],
        })
          .then((newThread) => {
            liveStream.privateMessageThreads.push(newThread.id);
            return liveStream.save();
          });
      });
  },

  async addParticipantToMessageThread({ id, user }, repository) {
    return repository.messageThread
      .findOne(id)
      .then((thread) => {
        if (!thread) {
          throw new Error(`User can not be addded to the Message Thread, because of MessageThread "${id}" does not exist!`);
        }

        if (thread.participants.some((participantId) => participantId === user.id)) {
          return true;
        }

        thread.participants.push(user.id);
        return thread.save();
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
      repository.streamChannelParticipant.load(liveStream.channel, user.id)
        .then((participant) => {
          if (participant && !participant.leavedAt) {
            return liveStream;
          }

          return activity.quitFromActiveChannels(user.id, repository)
            .then(() => {
              if (participant) {
                // eslint-disable-next-line no-param-reassign
                participant.leavedAt = null;
                return participant.save();
              }
              return activity.createChannelParticipant({ liveStream, user }, repository);
            });
        })
        .then(() => activity.createPrivateMessageThread({ liveStream, user }, repository))
        .then(() => activity.addParticipantToMessageThread({ id: liveStream.publicMessageThread, user }, repository))
        .then(() => {
          pubsub.publish('LIVE_STREAM_CHANGE', liveStream);
          return liveStream;
        })
    ));
};
