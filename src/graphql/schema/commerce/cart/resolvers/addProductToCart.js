const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { UserInputError, ApolloError } = require('apollo-server');

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    args,
    { product: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { deliveryRate: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { quantity: 'required|min:1|integer' },
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => Promise.all([
      repository.product.getById(args.product),
      repository.deliveryRateCache.getById(args.deliveryRate),
    ]))
    .then(([product, deliveryRate]) => {
      if (!product) {
        throw new UserInputError(`Product with id "${args.product}" does not exist!`, { invalidArgs: [product] });
      }

      if (!deliveryRate) {
        throw new UserInputError(`Delivery Rate with id "${args.deliveryRate}" does not exist!`, { invalidArgs: [deliveryRate] });
      }

      return repository.userCartItem.add({ productId: product.id, deliveryRateId: deliveryRate.id }, user.id, args.quantity);
    })
    .catch((error) => {
      throw new ApolloError(`Failed to add Product ot Cart. Original error: ${error.message}`, 400);
    });
};
