const path = require('path');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { ApolloError } = require('apollo-server');

const errorHandler = new ErrorHandler();

module.exports = async (obj, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(data, {
    label: 'required',
    width: 'required|min:0|decimal',
    height: 'required|min:0|decimal',
    length: 'required|min:0|decimal',
    unit: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.shippingBox.create({
      label: data.label,
      owner: user.id,
      width: data.width,
      height: data.height,
      length: data.length,
      unit: data.unit,
    }))
    .catch((error) => {
      throw new ApolloError(`Failed to add Shipping Box. Original error: ${error.message}`, 400);
    });
};
