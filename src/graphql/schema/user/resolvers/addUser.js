const uuid = require('uuid/v4');
const { Validator } = require('node-input-validator');
const { ErrorHandler } = require('../../../../lib/ErrorHandler');

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args.data, {
    email: 'required|email',
    password: 'required|minLength:6',
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return repository.user.create({
        id: uuid(),
        email: args.data.email,
        password: args.data.password,
      }, { roles: ['USER'] });
    });
};
