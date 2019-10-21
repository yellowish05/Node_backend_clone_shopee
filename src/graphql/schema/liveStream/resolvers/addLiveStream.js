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
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      const experience = repository.liveStreamExperience.getById(args.data.experience);
      if (!experience) {
        throw new UserInputError(`Live Stream Experience ${args.data.experience} does not exist`, { invalidArgs: 'experience' });
      }

      const categories = args.data.categories.map((category) => {
        const categoryObject = repository.liveStreamCategory.getById(category);
        if (!categoryObject) {
          throw new UserInputError(`Live Stream Category ${category} does not exist`, { invalidArgs: 'categories' });
        }
        return categoryObject;
      });

      return repository.liveStream.create({
        id: uuid(),
        streamer: user,
        title: args.data.title,
        experience: args.data.experience,
        categories: args.data.categories,
        preview: args.data.preview,
      }).then((liveStream) => {
        const liveStreamObject = liveStream.toObject();
        liveStreamObject.experience = experience;
        liveStreamObject.categories = categories;
        return liveStreamObject;
      }).catch((error) => {
        throw new ApolloError(`Failed to add Live Stream. Original error: ${error.message}`, 400);
      });
    });
};
