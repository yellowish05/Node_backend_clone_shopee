const uuid = require('uuid/v4');
const path = require('path');
const { UserInputError } = require('apollo-server');
const { Validator } = require('node-input-validator');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {
    const validator = new Validator(args.data, {
        phone: 'required|phoneNumber',
        countryCode: 'required',
        password: 'required|minLength:6|regex:^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])',
    });

    const validNumber = await phoneUtil.parse(args.data.phone);

    return validator.check()
        .then(async (matched) => {
            if (!matched) {
                throw errorHandler.build(validator.errors);
            }
        })
        .then(() => repository.user.findByPhone(args.data.phone))
        .then((existingUser) => {
            if (existingUser) {
                throw new UserInputError('Phone number already taken.', { invalidArgs: 'phone' });
            }
        })
        .then(() => {
            if (!phoneUtil.isValidNumberForRegion(validNumber, args.data.countryCode)) {
                if ((phoneUtil.getRegionCodeForNumber(validNumber) !== 'AR' && phoneUtil.getRegionCodeForNumber(validNumber) !== 'MX')
                    || phoneUtil.getRegionCodeForNumber(validNumber) !== args.data.countryCode
                    || !phoneUtil.isPossibleNumber(validNumber)) {
                    throw new UserInputError('The phone number must be a valid phone number.', { invalidArgs: 'phone' });
                }
            }
        })
        .then(() => repository.user.createByPhone({
            _id: uuid(),
            phone: args.data.phone,
            email: `${new Date().getTime()}${Number(Math.random() * 1000)}@tempmail.tmp`,
            countryCode: args.data.countryCode,
            password: args.data.password,
        }, { roles: ['USER'] }))
        .then((user) => {
            return user;
        });
};
