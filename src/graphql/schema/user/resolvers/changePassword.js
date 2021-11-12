const path = require("path");
const niv = require("node-input-validator");
const { UserInputError } = require("apollo-server");

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const { verificationCode, nexmoConfig } = require(path.resolve("config"));
const { EmailService } = require(path.resolve("src/bundles/email"));

const errorHandler = new ErrorHandler();
const Nexmo = require("nexmo");

const nexmo = new Nexmo({
  apiKey: nexmoConfig.apiKey,
  apiSecret: nexmoConfig.apiSecret,
});

const verifyResponseCode = {
  3: "INVALID_REQUEST_ID",
  16: "INVALID_CODE",
  6: "NOT_FOUND_OR_ALREADY_VERIFIED",
};

const activity = {
  verifyPhoneCode: ({ request_id, verificationCode }) => {
    return new Promise((resolve, reject) => {
      nexmo.verify.check(
        {
          request_id,
          code: verificationCode,
        },
        (err, result) => {
          if (result.status != 0) {
            reject(verifyResponseCode[result.status]);
          }
          resolve(true);
        }
      );
    });
  },
  recoverPasswordByEmail: (
    { user, verificationCode: vCode, newPassword },
    repository
  ) => {
    return repository.verificationCode
      .getByCodeAndUser(vCode, user.id)
      .then((code) => {
        if (!code) {
          throw new UserInputError("Verification code is not valid");
        }
        const creationDate = new Date(code.createdAt);
        const expirationdate = new Date(creationDate).setSeconds(
          creationDate.getSeconds() + verificationCode.TTL
        );
        if (expirationdate <= new Date()) {
          throw new UserInputError("Code is expired");
        }
      })
      .then(() =>
        Promise.all([
          repository.verificationCode.deactivate(user.id),
          repository.user.changePassword(user.id, newPassword),
        ])
      )
      .then(([, updatedUser]) => updatedUser);
  },
};

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const validator = new niv.Validator(args, {
    email: "requiredWithout:phone|email",
    phone: "requiredWithout:email|phoneNumber",
    password: "requiredWithout:verificationCode|string",
    verificationCode: "requiredWithout:password|string",
    request_id: "requiredWith:verificationCode",
    newPassword:
      "required|minLength:6|regex:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])",
  });

  niv.addCustomMessages({
    "request_id.requiredWith": "Request id is required to verify the code.",
    "email.requiredWithout": "Email or phone number is required.",
    "password.requiredWithout": "password or verification code is required.",
  });

  return validator
    .check()
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      if (args.email) return repository.user.findByEmail(args.email);
      return activity
        .verifyPhoneCode(args)
        .then(() => repository.user.findByPhone(args.phone))
        .catch((err) => {
          throw new UserInputError(err);
        });
    })
    .then((user) => {
      if (!user) {
        throw new UserInputError("User does not exists");
      }
      // update password
      if (args.password) {
        if (args.email) {
          return repository.user.findByEmailAndPassword(args).then((user) => {
            if (!user) {
              throw new UserInputError("Wrong password");
            }
            return repository.user.changePassword(user.id, args.newPassword);
          });
        }
        if (args.phone) {
          return repository.user.findByPhoneAndPassword(args).then((user) => {
            if (!user) {
              throw new UserInputError("Wrong password");
            }
            return repository.user.changePassword(user.id, args.newPassword);
          });
        }
      }

      // forgot password
      if (args.email) {
        return activity.recoverPasswordByEmail({ ...args, user }, repository);
      }
      return repository.user.changePassword(user.id, args.newPassword);
    })
    .then((user) => {
      EmailService.sendPasswordChanged({ user }).catch();
      return true;
    });
};
