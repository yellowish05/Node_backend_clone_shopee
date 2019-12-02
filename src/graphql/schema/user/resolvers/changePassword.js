const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { verificationCode } = require(path.resolve('config'));
const { EmailService } = require(path.resolve('src/bundles/email'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args, {
    email: 'required|email',
    newPassword: 'required|minLength:6|regex:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
    '*': 'any:password,verificationCode',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.user.findByEmail(args.email))

    .then((existingUser) => {
      if (!existingUser) {
        throw new UserInputError('User does not exists');
      }
      return existingUser;
    })
    .then((user) => {
      if (args.password) {
        return repository.user
          .findByEmailAndPassword(args)
          .then((user) => {
            if (!user) {
              throw new UserInputError('Wrong password');
            }

            return repository.user.changePassword(user.id, args.newPassword);
          })
      }

      return repository.verificationCode
        .getByCodeAndUser(args.verificationCode, user.id)
        .then((code) => {
          if (!code) {
            throw new UserInputError('Verification code is not valid');
          }
          return code;
        })
        .then((code) => {
          const creationDate = new Date(code.createdAt);
          const expirationdate = new Date(creationDate)
            .setSeconds(creationDate.getSeconds() + verificationCode.TTL);
          if (expirationdate <= new Date()) {
            throw new UserInputError('Code is expired');
          }
        })
        .then(() => Promise.all([
          repository.verificationCode.deactivate(user.id),
          repository.user.changePassword(user.id, args.newPassword),
        ]));
    })
    .then((data) => {
      const user = data[1] || data;

      EmailService.sendPasswordChanged({user});

      return user;
    })
    .then(() => true);
};
