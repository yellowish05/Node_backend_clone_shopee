const uuid = require('uuid/v4');
const { Validator } = require('node-input-validator');
const { ErrorHandler } = require('../../../../lib/ErrorHandler');

const errorHandler = new ErrorHandler();

module.exports = async function register(obj, args, { dataSources: { api } }) {
  const validator = new Validator(args.input, {
    email: 'required|email',
    password: 'required|minLength:6',
  });
  

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return api.auth.create({
        id: uuid(),
        email: args.input.email,
        password: args.input.password,
      });
    })
};
