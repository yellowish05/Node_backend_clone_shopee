const uuid = require('uuid/v4');
const path = require('path');
const { UserInputError } = require('apollo-server');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { OAuth2Service } = require(path.resolve('src/lib/OAuth2Service'));

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
    .then((user) => {
      if (user === null) {
        throw new UserInputError(`User not found by ${data.provider} provider`);
      }

      return (user.email ? repository.user.findByEmail(user.email) : repository.user.findByProvider(data.provider, user.id))
        .then((existingUser) => {
          if (!existingUser) {
            const userId = uuid();
            return repository.asset.createFromUri({
              userId,
              url: user.photo,
            })
              .then((asset) => repository.user.createByProvider({
                _id: userId,
                email: user.email || `${userId}@tempmail.tmp`,
                name: user.name,
                photo: asset,
                provider: data.provider,
                providerId: user.id,
              }, { roles: ['USER'] }));
          }

          if (!existingUser.photo) {
            return repository.asset.createFromUri({
              userId: existingUser.id,
              url: user.photo,
            })
              .then((asset) => {
                repository.user.update(existingUser.id, {
                  name: existingUser.name || user.name,
                  photo: asset,
                  provider: data.provider,
                  providerId: user.id,
                });
              });
          }

          return repository.user.update(existingUser.id, {
            name: existingUser.name || user.name,
            provider: data.provider,
            providerId: user.id,
          });
        });
    })
    .then((user) => repository.accessToken.create(user));
};
