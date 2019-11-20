const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ForbiddenError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
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

  async checkLiveStreamOwner(liveStream, user) {
    if (liveStream.streamer !== user.id) {
      throw new ForbiddenError('You cannot add products to this Live Stream');
    }
    return liveStream;
  },

  async addProductsToLiveStream({ liveStream, productIds }, repository) {
    return Promise.all(productIds.map((productId) => repository.product.getById(productId)))
      .then((products) => {
        products.forEach((product) => {
          if (!product) {
            throw new Error('Product can not be addded to the Live Stream, because of Product does not exist!');
          }

          if (product.seller !== liveStream.streamer) {
            throw new ForbiddenError('You cannot add products to this Live Stream');
          }

          if (liveStream.products.some((pId) => pId === product.id)) {
            return true;
          }

          return liveStream.products.push(product.id);
        });
        return liveStream.save();
      });
  },
};

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    args,
    { liveStream: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { productIds: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => activity.checkIfLiveStreamExist(args.liveStream, repository))
    .then((liveStream) => activity.checkLiveStreamOwner(liveStream, user))
    .then((liveStream) => activity.addProductsToLiveStream({ liveStream, productIds: args.productIds }, repository))
    .then((liveStream) => {
      pubsub.publish('LIVE_STREAM_CHANGE', liveStream);
      return liveStream;
    });
};
