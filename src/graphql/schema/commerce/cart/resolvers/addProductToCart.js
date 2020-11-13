const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    args,
    { product: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']] },
    { quantity: 'required|min:1|integer' },
    { billingAddress: 'required' },
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
      args.productAttribute ? repository.productAttributes.getById(args.productAttribute) : null,
    ]))
    .then(async ([product, deliveryRate, productAttr]) => {
      if (!product) {
        throw new UserInputError(`Product with id "${args.product}" does not exist!`, { invalidArgs: [product] });
      }
      if (args.productAttribute && !productAttr) {
        throw new ForbiddenError('Product does not exist.');
      }

      const checkAmount = productAttr != null
        ? await repository.productAttributes.checkAmountByAttr(args.productAttribute, args.quantity)
        : await repository.product.checkAmount(args.product, args.quantity);
      
      if (!checkAmount) 
        throw new ForbiddenError('This product is not enough now');

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
        .then(async () => {
          const productInfo = await repository.product.getById(args.product);
          // calculate quantity
          if (productAttr) {
            productAttr.quantity -= quantity;
            await productAttr.save();
          } else {
            productInfo.quantity -= quantity;
            await productInfo.save();
          }
          return repository.userCartItem.add(cartItemData, user.id);
        });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to add Product to Cart. Original error: ${error.message}`, 400);
    });
};
