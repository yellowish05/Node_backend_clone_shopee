const path = require('path');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');

const loadCart = require('./loadCart');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository }, user }) => {
  const validator = new Validator(
    args,
    { discountCode: 'required' },
  );

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      const discount = await repository.discount.getItemByCode(user.id, args.discountCode);
      repository.userCartItem.applyDiscountCode(discount);
    })
    .then(() => loadCart({}, {}, { dataSources: { repository }, user }))
    .catch((error) => {
      throw new ApolloError(`Failed to update Cart Item. Original error: ${error.message}`, 400);
    });
};
