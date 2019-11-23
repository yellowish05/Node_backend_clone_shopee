const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');
const requireDir = require('require-dir');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { email } = require(path.resolve('config'));
const logger = require(path.resolve('config/logger'));
const EmailProvider = require(path.resolve('config/emailProvider'));

const errorHandler = new ErrorHandler();

const templates = requireDir('../view');

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new Validator(args, {
    email: 'required|email',
    template: 'required',
  });

  return validator.check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(() => repository.user.findByEmail(args.email))
    .then((user) => {
      if (!user) {
        throw new UserInputError('User does not exists');
      }
      return user;
    })
    .then((user) => (
      repository.verificationCode.deactivate(user.id)
        .then(() => repository.verificationCode.create({ user: user.id }))
        .then((newCode) => {
          const template = templates[args.template];
          if (!template) {
            throw new UserInputError('Template does not exists', { invalidArgs: 'template' });
          }

          const params = {
            subject: template.subject,
            to: args.email,
            from: email.from,
            body: template.build({ code: newCode.code, user }),
            bodyType: email.bodyType,
          };

          logger.debug(`[EMAIL] try send email ${JSON.stringify(params)}`);
          return EmailProvider.Email.Send(params);
        })
        .catch((err) => {
          throw new ApolloError(err);
        })
        .then(() => true)
    ));
};
