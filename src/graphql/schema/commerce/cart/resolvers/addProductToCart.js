const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { UserInputError, ApolloError } = require('apollo-server');

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    args,
    { product: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { quantity: 'required|min:1|integer' },
    { size: 'required' },
    { color: 'required' },
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
      repository.productAttributes.getByAttr(product, color, size),
    ]))
    .then(([product, deliveryRate, productAttr]) => {
      if (!product) {
        throw new UserInputError(`Product with id "${args.product}" does not exist!`, { invalidArgs: [product] });
      }

      if (!productAttr && color != "" && size != "") {
        throw new ForbiddenError(`Product that has color: "${color}" and size: "${size}" does not exist.`);
      }

      const cartItemData = {
        productId: product.id,
        quantity: args.quantity,
        productAttribute: productAttr,
      };
      if (deliveryRate) {
        cartItemData.deliveryRateId = deliveryRate.id;
      }

      return repository.deliveryRate.create(deliveryRate.toObject())
        .then(() => repository.userCartItem.add(cartItemData, user.id));
    })
    .catch((error) => {
      throw new ApolloError(`Failed to add Product ot Cart. Original error: ${error.message}`, 400);
    });
};
