const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { nexmoConfig } = require(path.resolve('config'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
const nev = require('node-email-validator');

const { EmailService } = require(path.resolve('src/bundles/email'));
const Nexmo = require('nexmo');

const nexmo = new Nexmo({
    apiKey: nexmoConfig.apiKey,
    apiSecret: nexmoConfig.apiSecret,
});

const activity = {
  validatePhoneNumber: async (args, repository) => {
    const validNumber = await phoneUtil.parse(args.phone);

    if (!phoneUtil.isValidNumberForRegion(validNumber, args.countryCode)) {
        if ((phoneUtil.getRegionCodeForNumber(validNumber) !== 'AR' && phoneUtil.getRegionCodeForNumber(validNumber) !== 'MX')
            || phoneUtil.getRegionCodeForNumber(validNumber) !== args.countryCode
            || !phoneUtil.isPossibleNumber(validNumber)) {
            throw new UserInputError('The phone number must be a valid phone number.', { invalidArgs: 'phone' });
        }
    }
    const user = await repository.user.findByPhone(args.phone);
    if (!user) {
        throw new UserInputError('User does not exist!');
    }
    return user;
  },
  validateEmail: async (args, repository) => {
    const re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
    if (!re.test(args.email)) throw new UserInputError('The email is not valid!', { invalidArgs: 'email' });

    const user = await repository.user.findByEmail(args.email);
    if (!user) {
      throw new UserInputError('User does not exist!');
    }
    return user;
  },
}

module.exports = async (obj, args, { dataSources: { repository } }) => {
  const viaPhone = args.countryCode && args.phone;
  let user;
  if (viaPhone) {
    user = await activity.validatePhoneNumber(args, repository);
  } else {
    user = await activity.validateEmail(args, repository);
  }
  
  console.log("user => ", user);

  return repository.verificationCode.deactivate(user.id)
    .then(() => repository.verificationCode.create({ user: user.id }))
    .then((newCode) => {
      console.log("new code => ", newCode);
      if (viaPhone) {
        // send verification code to phone by sms
        return new Promise((resolve, reject) => {
          nexmo.message.sendSms(
            'Shoclef',
            args.phone.replace("+", ""),
            newCode.code,
            (err, result) => {
                console.log("result =>", result);
                if (result.messages[0].status != 0)
                    reject(result.messages[0]['error-text']);
                if (err) {
                  console.log("nexmore error", error)
                  reject(err)
                }
                resolve({ id: result.request_id });
            });
        });
      } else {
        return EmailService.sendRecoverPasswordCode({ user, code: newCode.code });
      }            
    })
    .then(() => true)
    .catch((err) => {
        throw new ApolloError(err);
    })
};
