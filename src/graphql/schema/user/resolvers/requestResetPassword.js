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

module.exports = async (obj, args, { dataSources: { repository } }) => {
    const validNumber = await phoneUtil.parse(args.phone);
    
    if (!phoneUtil.isValidNumberForRegion(validNumber, args.data.countryCode)) {
        if ((phoneUtil.getRegionCodeForNumber(validNumber) !== 'AR' && phoneUtil.getRegionCodeForNumber(validNumber) !== 'MX')
            || phoneUtil.getRegionCodeForNumber(validNumber) !== args.data.countryCode
            || !phoneUtil.isPossibleNumber(validNumber)) {
            throw new UserInputError('The phone number must be a valid phone number.', { invalidArgs: 'phone' });
        }
    }
    const user = await repository.user.findByPhone(args.data.phone);
    if (!user) {
        throw new UserInputError('User does not exists');
    }
    console.log("user => ", user);
            
    await repository.verificationCode.deactivate(user.id)
        .then(() => repository.verificationCode.create({ user: user.id }))
        .then((newCode) => {
            // send verification code to phone by sms
            console.log("new code => ", newCode);
            return new Promise((resolve, reject) => {
                nexmo.message.sendSms(
                    'Shoclef',
                    args.data.phone.replace("+", ""),
                    newCode.code,
                    (err, result) => {
                        console.log("result =>", result);
                        if (result.messages[0].status != 0)
                            reject(result.messages[0]['error-text']);
                        if (err) reject(err);
                        resolve({ id: result.request_id });
                    });
            });
        })
        .catch((err) => {
            throw new ApolloError(err);
        })
        .then(() => true)
};
