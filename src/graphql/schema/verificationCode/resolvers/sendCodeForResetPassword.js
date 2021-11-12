const path = require("path");
const niv = require("node-input-validator");
const { UserInputError } = require("apollo-server");

const { EmailService } = require(path.resolve("src/bundles/email"));
const {
  sendVerificationSMS,
  validatePhoneNumber,
  validateEmail,
} = require("../common");
const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

const activity = {
  validateAndGetUser: ({ email, phone, countryCode }, repository) => {
    if (email) {
      return validateEmail({ email }).then((isValid) =>
        repository.user.findByEmail(email)
      );
    }
    return validatePhoneNumber({ phone, countryCode }).then(() =>
      repository.user.findByPhone(phone)
    );
  },
};

module.exports = async (_, { data }, { dataSources: { repository } }) => {
  const validator = new niv.Validator(data, {
    email: "requiredWithout:phone|email",
    phone: "requiredWithout:email",
    countryCode: "requiredWith:phone",
  });

  niv.addCustomMessages({
    "email.requiredWithout": "Email or phone number is required.",
    "countryCode.requiredWith": "Country code is required with phone number.",
  });

  return validator
    .check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return activity.validateAndGetUser(data, repository);
    })
    .then(async (user) => {
      if (!user) {
        throw new UserInputError("Not found the user!");
      }
      await repository.verificationCode.deactivate(user.id);

      if (data.phone && data.countryCode) {
        return sendVerificationSMS({ phone: data.phone })
          .then((requestId) =>
            repository.verificationCode.create({
              user: user.id,
              requestId,
            })
          )
          .then((verificationCode) => verificationCode.id);
      }

      return repository.verificationCode
        .create({ user: user.id })
        .then((verificationCode) =>
          EmailService.sendRecoverPasswordCode({
            user,
            code: verificationCode.code,
          }).then(() => verificationCode.id)
        );
    })
    .then((requestId) => ({
      success: true,
      requestId,
    }))
};
