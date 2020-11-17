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
  
  if (args.attrId) {
    validator.addPostRule(async (provider) => Promise.all([
      repository.productAttributes.getById(provider.inputs.attrId),
    ])
    .then(([productAttr]) => {
        if (!productAttr) {
          provider.error('Product Attribute', 'custom', `Product attribute with id "${provider.inputs.attrId}" does not exist!`);
        } else if (productAttr.quantity < provider.inputs.quantity) {
          provider.error('Product Attribute', 'custom', `You can't add items more than in stock, ${productAttr.quantity}!`);
        }
    }));
  }

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
      if (product.wholesaleEnabled) {
        if (!args.metricUnit) {
          throw new UserInputError(`Product with id "${args.product}" is for wholesale!`, { invalidArgs: [product] })
        } else {
          let [selectedItem] = product.metrics.filter(metricItem => metricItem.metricUnit === args.metricUnit);
          if (!selectedItem) {
            throw new UserInputError(`Product with id "${args.product}" doesn't have metric unit ${args.metricUnit}!`, { invalidArgs: [product] })
          } else {
            if (args.quantity < selectedItem.minCount) {
              throw new UserInputError(`Product with id "${args.product}" should be added at least ${selectedItem.minCount} ${args.metricUnit}(s)`, { invalidArgs: [ product ] });
            }
          }
        }
      }

      const checkAmount = productAttr !== null ? (await repository.productAttributes.checkAmountByAttr(args.productAttribute, args.quantity)) : (await repository.productInventoryLog.checkAmount(args.product, args.quantity));

      if (!checkAmount) { throw new ForbiddenError('This product is not enough now'); }

      // Biwu's past work
      // const cartItemData = {
      //   productId: product.id,
      //   quantity: args.quantity,
      //   metricUnit: args.metricUnit || null,
      //   attrId: args.attrId || null
      // };
      // // if (args.metricUnit) {
      // //   cartItemData.metricUnit = args.metricUnit;
      // // }
      // if (deliveryRate) {
      //   cartItemData.deliveryRateId = deliveryRate.id;
      // }
      // return repository.deliveryRate.create(deliveryRate.toObject())
      //   .then(() => repository.userCartItem.add(cartItemData, user.id));

      return repository.deliveryRate.create(deliveryRate.toObject())
        .then(async () => {
          // calculate quantity
          if (productAttr) {
            productAttr.quantity -= args.quantity;
            await productAttr.save();
          } else {
            repository.productInventoryLog.decreaseQuantity(args.product, args.quantity);
          }
          return repository.userCartItem.add(cartItemData, user.id);
        });
    })
    .catch((error) => {
      throw new ApolloError(`Failed to add Product ot Cart. Original error: ${error.message}`, 400);
    });
};
