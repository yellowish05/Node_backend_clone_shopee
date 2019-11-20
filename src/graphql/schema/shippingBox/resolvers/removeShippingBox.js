const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { ApolloError, ForbiddenError } = require('apollo-server');

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(args, {
    id: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.shippingBox.findOne(args.id))
    .then((shippingBox) => {
      if (!shippingBox) {
        throw new ApolloError('Shipping box does not exists', 400);
      }

      if (user.id !== shippingBox.owner) {
        throw new ForbiddenError('You can not remove this shipping box', 400);
      }

      return repository.shippingBox.remove(args.id);
    })
    .then(() => true)
    .catch((error) => {
      throw new ApolloError(`Failed to remove Shipping Box. Original error: ${error.message}`, 400);
    });
};
