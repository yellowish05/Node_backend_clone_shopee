const path = require('path');
const { Validator } = require('node-input-validator');
const { UserInputError, ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { EmailService } = require(path.resolve('src/bundles/email'));
const { VerificationEmailTemplate } = require(path.resolve('src/lib/Enums'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {

    const templateMapper = {
        [VerificationEmailTemplate.RESET_PASSWORD]: 'sendRecoverPasswordCode'
    }

    const validator = new Validator(args, {
        email: 'required|email'
    });

    return validator.check()
        .then(async (matched) => {
            if (!matched) {
                throw errorHandler.build(validator.errors);
            }
        })
        .then(() => repository.verificationCode.create({ user: user.id }))
        .then((newCode) => {
            EmailService[templateMapper[VerificationEmailTemplate.SIGNUP]]({ code: newCode.code });
            return newCode
        })
        .catch((err) => {
            throw new ApolloError(err);
        })

};
