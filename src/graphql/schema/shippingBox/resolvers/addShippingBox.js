const path = require('path');
const niv = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { ApolloError } = require('apollo-server');
const { providers: { EasyPost } } = require(path.resolve('src/bundles/delivery'));
const errorHandler = new ErrorHandler();

module.exports = async (obj, { data }, { dataSources: { repository }, user }) => {
  niv.extend('greater', ({ value, args }, validator) => {
    return (value > (args[0] || 0));
  });
  niv.extendMessages({
    greater: 'The :attribute field must be greater than :value',
  });
  const validator = new niv.Validator(data, {
    label: 'required',
    width: 'required|greater:0|min:0|decimal',
    height: 'required|greater:0|min:0|decimal',
    length: 'required|greater:0|min:0|decimal',
    weight: 'required|greater:0|min:0|decimal',
    unit: 'required',
    unitWeight: 'required'
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => {
      return EasyPost.addParcel(data)
        .then(response => repository.shippingBox.create({
          parcelId: response.id,
          label: data.label,
          owner: user.id,
          width: data.width,
          height: data.height,
          length: data.length,
          weight: data.weight,
          unit: data.unit,
          unitWeight: data.unitWeight
        }))
    })
    .catch((error) => {
      throw new ApolloError(`Failed to add Shipping Box. Original error: ${error.message}`, 400);
    });
};
