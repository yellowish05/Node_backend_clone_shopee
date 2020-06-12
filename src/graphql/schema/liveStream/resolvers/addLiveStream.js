const uuid = require('uuid/v4');
const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const {
  StreamChannelStatus, StreamChannelType, StreamRecordStatus, StreamRole,
} = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { AgoraService } = require(path.resolve('src/lib/AgoraService'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args.data, {
    title: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => {
      const experience = repository.liveStreamExperience.getById(args.data.experience);
      if (!experience) {
        throw new UserInputError(`Live Stream Experience ${args.data.experience} does not exist`, { invalidArgs: 'experience' });
      }

      args.data.categories.map((category) => {
        const categoryObject = repository.liveStreamCategory.getById(category);
        if (!categoryObject) {
          throw new UserInputError(`Live Stream Category ${category} does not exist`, { invalidArgs: 'categories' });
        }
        return categoryObject;
      });
    })
    .then(() => repository.asset.load(args.data.preview))
    .then((asset) => {
      if (args.data.preview && !asset) {
        throw new UserInputError(`Asset ${args.data.preview} does not exist`, { invalidArgs: 'preview' });
      }
    })
    .then(() => Promise.all(args.data.products.map((productId) => repository.product.getById(productId)))
      .then((products) => {
        products.forEach((product) => {
          if (!product) {
            throw new Error(`Product can not be addded to the Live Stream, because of Product "${product.id}" does not exist!`);
          }

          if (product.seller !== user.id) {
            throw new ForbiddenError(`You cannot add product "${product.id}" to this Live Stream`);
          }
        });
      }))
    .then(() => {
      const channelId = uuid();
      const liveStreamId = uuid();
      const agoraToken = AgoraService.buildTokenWithAccount(channelId, user.id, StreamRole.PUBLISHER);

      const channel = {
        _id: channelId,
        type: StreamChannelType.BROADCASTING,
        status: StreamChannelStatus.PENDING,
        record: {
          enabled: true,
          status: StreamRecordStatus.PENDING,
        },
      };

      if(args.data.liveStreamRecord)
      {
        channel.record.sources = [args.data.liveStreamRecord];
      }

      const messageThread = {
        tags: [`LiveStream:${liveStreamId}`],
        participants: [user],
      };

      const participant = {
        channel: channelId,
        token: agoraToken,
        user,
        isPublisher: true,
      };

      return Promise.all([
        liveStreamId,
        repository.streamChannel.create(channel),
        repository.messageThread.create(messageThread),
        repository.streamChannelParticipant.create(participant),
        repository.city.findByName(args.data.city || user.address.city),
      ]);
    })
    .then(([_id, streamChannel, messageThread, , city]) => {
      repository.userHasMessageThread.create({
        thread: messageThread.id,
        user: user.id,
        readBy: Date.now(),
        muted: true,
        hidden: true,
      }).catch((error) => {
        logger.error(`Failed to update User Thread on join public thread for user "${user.id}". Original error: ${error}`);
      });

      return repository.liveStream.create({
        _id,
        streamer: user,
        title: args.data.title,
        status: StreamChannelStatus.PENDING,
        experience: args.data.experience,
        categories: args.data.categories,
        city,
        preview: args.data.preview,
        channel: streamChannel,
        publicMessageThread: messageThread,
        products: args.data.products,
        length: 0,
        realViews: 0,
        realLikes: 0,
        fakeViews: 0,
        fakeLikes: 0,
      });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to add Live Stream. Original error: ${error.message}`, 400);
    });
};
