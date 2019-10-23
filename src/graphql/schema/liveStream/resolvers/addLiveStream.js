const uuid = require('uuid/v4');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');
const { ErrorHandler } = require('../../../../lib/ErrorHandler');

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args.data, {
    title: 'required',
    preview: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

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

      const asset = await repository.asset.load(args.data.preview);
      if (!asset) {
        throw new UserInputError(`Asset ${args.data.preview} does not exist`, { invalidArgs: 'preview' });
      }

      const liveStreamData = {
        _id: uuid(),
        streamer: user,
        title: args.data.title,
        experience: args.data.experience,
        categories: args.data.categories,
        preview: asset,
      };

      return repository.liveStream
        .create(liveStreamData)
        .catch((error) => {
          throw new ApolloError(`Failed to add Live Stream. Original error: ${error.message}`, 400);
        });
    });
};
