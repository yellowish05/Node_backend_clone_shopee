const path = require("path");
const niv = require("node-input-validator");
const { UserInputError } = require("apollo-server");

const {
  verificationCode: { TTL },
} = require(path.resolve("config"));
const { VerificationCodeStatus } = require(path.resolve("src/lib/Enums"));
const { verifySMSCode } = require("../common");
const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

const verifyCode = (verificationCode) => {
  verificationCode.status = VerificationCodeStatus.VERIFIED;
  return verificationCode.save().then(() => ({
    success: true,
    message: "success",
  }));
};

module.exports = (_, { data }, { dataSources: { repository } }) => {
  const validator = new niv.Validator(data, {
    requestId: "required",
    code: "required",
  });

  return validator
    .check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
      return repository.verificationCode.getById(data.requestId);
    })
    .then(async (verificationCode) => {
      if (!verificationCode) {
        return {
          success: false,
          message: "Not found the verification request!",
        };
      }

      // verification via email;
      if (verificationCode.code) {
        if (verificationCode.code === data.code) {
          return verifyCode(verificationCode);
        }
        return {
          success: false,
          message: "Invalid verification code",
        };
      } else if (verificationCode.requestId) {
        // verification via phone
        return verifySMSCode({
          code: data.code,
          requestId: verificationCode.requestId,
        })
          .then((result) => {
            if (result.success) {
              verifyCode(verificationCode);
            }
            return result;
          })
          .catch((error) => ({
            success: false,
            message: error.message,
          }));
      } else {
        throw new Error("Invalid verification request!");
      }
    })
    .catch((error) => ({
      success: false,
      message: error.message,
    }));
};
