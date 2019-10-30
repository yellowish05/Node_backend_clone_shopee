const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError } = require('apollo-server');
const requireDir = require('require-dir');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { email } = require(path.resolve('config'));
const EE = require(path.resolve('config/emailProvider'));

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
    .then((existingUser) => {
      if (!existingUser) {
        throw new UserInputError('User does not exists');
      }
      return existingUser;
    })
    .then((user) => {
      repository.verificationCode.deactivate(user.id);
      EE.Account.Load();
      return repository.verificationCode.create({ user: user.id })
        .then((newCode) => {
          const template = templates[args.template];
          if (!template) {
            throw new UserInputError('Template does not exists', { invalidArgs: 'template' });
          }

          const emailBody = template.build({ code: newCode.code, user });
          const emailParams = {
            subject: template.subject,
            to: args.email,
            from: email.emailFrom,
            body: emailBody,
            bodyType: email.emailBodyType,
          };
          return EE.Email.Send(emailParams)
            .catch((err) => {
              throw new Error(err);
            })
            .then(() => true);
        });
    });
};
