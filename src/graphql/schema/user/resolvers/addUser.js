const uuid = require('uuid/v4');
const path = require('path');
const { UserInputError } = require('apollo-server');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const { EmailService } = require(path.resolve('src/bundles/email'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args.data, {
    email: 'required|email',
    password: 'required|minLength:6|regex:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.user.findByEmail(args.data.email))
    .then((existingUser) => {
      if (existingUser) {
        throw new UserInputError('Email already taken', { invalidArgs: 'email' });
      }
    })
    .then(() => repository.user.create({
      _id: uuid(),
      email: args.data.email,
      password: args.data.password,
    }, { roles: ['USER'] }))
    .then((user) => {
      EmailService.sendWelcome({user});
      return user;
    });
};
