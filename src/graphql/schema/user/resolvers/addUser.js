const uuid = require('uuid/v4');
const { UserInputError } = require('apollo-server');
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

      const existingUser = repository.user.findByEmail(args.data.email);
      if (existingUser) {
        throw new UserInputError('Email already taken', { invalidArgs: 'email' });
      }

      return repository.user.create({
        _id: uuid(),
        email: args.data.email,
        password: args.data.password,
      }, { roles: ['USER'] });
    });
};
