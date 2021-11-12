const path = require("path");
const Nexmo = require("nexmo");
const phoneUtil =
  require("google-libphonenumber").PhoneNumberUtil.getInstance();
const { nexmoConfig } = require(path.resolve("config"));

const nexmo = new Nexmo({
  apiKey: nexmoConfig.apiKey,
  apiSecret: nexmoConfig.apiSecret,
});

module.exports = {
  validatePhoneNumber: ({ phone, countryCode }) => {
    return Promise.resolve(phoneUtil.parse(phone)).then((validNumber) => {
      if (!phoneUtil.isValidNumberForRegion(validNumber, countryCode)) {
        if (
          (phoneUtil.getRegionCodeForNumber(validNumber) !== "AR" &&
            phoneUtil.getRegionCodeForNumber(validNumber) !== "MX") ||
          phoneUtil.getRegionCodeForNumber(validNumber) !== countryCode ||
          !phoneUtil.isPossibleNumber(validNumber)
        ) {
          throw new Error("The phone number must be a valid phone number.");
        }
      }
      return true;
    });
  },
  validateEmail: async ({ email }) => {
    const re =
      /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    if (!re.test(email)) throw new Error("The email is not valid!");
    return true;
  },
  sendVerificationSMS: ({ phone }) => {
    return new Promise((resolve, reject) => {
      nexmo.verify.request(
        {
          number: phone.replace("+", ""),
          brand: "Shoclef",
          code_length: "6",
        },
        (err, result) => {
          if (err) reject(err);
          if (result && result.status !== "0") reject(result.error_text);
          else resolve(result.request_id);
        }
      );
    });
  },
  verifySMSCode: ({ requestId, code }) => {
    const verifyResponseCode = {
      3: "INVALID_REQUEST_ID",
      16: "INVALID_CODE",
      6: "NOT_FOUND_OR_ALREADY_VERIFIED",
    };
    return new Promise((resolve, reject) => {
      nexmo.verify.check(
        {
          request_id: requestId,
          code,
        },
        (err, result) => {
          if (err) reject(err);
          if (result.status !== "0") {
            const message = result.error_text
              .replace("Nexmo", "Shoclef")
              .replace(`Request '${requestId}'`, "Your request");
            resolve({
              success: false,
              message,
            });
          }
          resolve({
            success: true,
            message: "success",
          });
        }
      );
    });
  },
};
