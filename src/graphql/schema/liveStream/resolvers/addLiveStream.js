const uuid = require('uuid/v4');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');
const { StreamChannelStatus, StreamChannelType, StreamRole } = require('../../../../lib/Enums');
const { ErrorHandler } = require('../../../../lib/ErrorHandler');
const { AgoraService } = require('../../../../lib/AgoraService');

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
    .then(() => {
      // Generate agora token
      const id = uuid();
      const token = AgoraService.buildTokenWithAccount(id, user._id, StreamRole.PUBLISHER);

      return repository.streamChannelParticipant.create({
        _id: uuid(),
        channel: id,
        token,
        user,
        isPublisher: true,
      }).then(() => repository.streamChannel
        .create({
          _id: id,
          type: StreamChannelType.BROADCASTING,
          status: StreamChannelStatus.PENDING,
        }).catch((error) => {
          throw new ApolloError(`Failed to add Stream Channel. Original error: ${error.message}`, 400);
        }));
    })
    .then((streamChannel) => repository.liveStream
      .create({
        _id: uuid(),
        streamer: user,
        title: args.data.title,
        experience: args.data.experience,
        categories: args.data.categories,
        preview: args.data.preview,
        channel: streamChannel,
      })
      .catch((error) => {
        throw new ApolloError(`Failed to add Live Stream. Original error: ${error.message}`, 400);
      }));
};
