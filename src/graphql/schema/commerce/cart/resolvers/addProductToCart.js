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
    { billingAddress: 'required' },
  );

  validator.addPostRule(async (provider) => {
    if (provider.inputs.productAttribute) {
      await repository.productAttributes.getById(provider.inputs.productAttribute)
        .then((attr) => {
          if (!attr) { provider.error('Invalid Product Attribute'); }
        });
    }
  });

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
      const cartItemData = {
        productId: product.id,
        quantity: args.quantity,
        productAttribute: args.productAttribute,
        billingAddress: args.billingAddress,
      };
      if (deliveryRate) {
        cartItemData.deliveryRateId = deliveryRate.id;
      }

      return repository.deliveryRate.create(deliveryRate.toObject())
        .then(() => repository.userCartItem.add(cartItemData, user.id));
    })
    .catch((error) => {
      throw new ApolloError(`Failed to add Product to Cart. Original error: ${error.message}`, 400);
    });
};
