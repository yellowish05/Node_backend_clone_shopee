const uuid = require('uuid/v4');
const path = require('path');
const { UserInputError } = require('apollo-server');
const { Validator } = require('node-input-validator');
const logger = require('../../../../../config/logger');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { OAuth2Service } = require(path.resolve('src/lib/OAuth2Service'));
const { EmailService } = require(path.resolve('src/bundles/email'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, { data }, { dataSources: { repository } }) => {
  const validator = new Validator(data, {
    provider: 'required',
    token: 'required',
  });

  return validator.check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      const provider = OAuth2Service.getStrategy(data.provider);
      return provider.getUserProfile(data.token);
    })
    .then((socialUserData) => {
      if (socialUserData === null) {
        throw new UserInputError(`User not found by ${data.provider} provider`);
      }

      logger.debug(JSON.stringify(socialUserData));

      return repository.user.findByProvider(data.provider, socialUserData.id)
        .then((user) => {
          if (user) {
            throw new UserInputError(`${data.provider} user already exists`);
          }
          if (socialUserData.email) {
            user = repository.user.findByEmail(socialUserData.email);
            if (!user || Object.keys(user) === 0) {
              throw new UserInputError(`Email already taken ${socialUserData.email}`);
            }
          }

          return;
        })
        .then(() => {
          const userId = uuid();
          return repository.asset.createFromUri({
            userId,
            url: socialUserData.photo,
          })
            .then((asset) => repository.user.createByProvider({
              _id: userId,
              email: socialUserData.email,
              name: socialUserData.name,
              photo: asset,
              provider: data.provider,
              providerId: socialUserData.id,
            }, { roles: ['USER'] }))
            .then((user) => {
              if (socialUserData.email) {
                EmailService.sendWelcome({ user });
              }
              return user;
            });
        });
    });
};
