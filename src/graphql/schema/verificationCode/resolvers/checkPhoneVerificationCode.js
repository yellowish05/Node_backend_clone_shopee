const uuid = require('uuid/v4');
const path = require('path');
const { UserInputError } = require('apollo-server');
const { Validator } = require('node-input-validator');

const { nexmoConfig } = require(path.resolve('config'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

const errorHandler = new ErrorHandler();
const Nexmo = require('nexmo');

const nexmo = new Nexmo({
  apiKey: nexmoConfig.apiKey,
  apiSecret: nexmoConfig.apiSecret,
});

module.exports = async (obj, args, { dataSources: { repository } }) => {
    const validator = new Validator(args.data, {
        code: 'required',
        request_id: 'required',
    });

    return await validator.check()
        .then(async (matched) => {
            if (!matched) {
                throw errorHandler.build(validator.errors);
            }
        })
        .then(async () => {
            return new Promise((resolve, reject) => {
                nexmo.verify.check({
                    request_id: args.data.request_id,
                    code: args.data.code
                }, (err, result) => {
                    console.log(result);
                    if (result.status != 0) {
                        var message = result.error_text.replace('Nexmo', 'Shoclef');
                        message = message.replace("Request '" + args.data.request_id + "'", 'Your request');
                        resolve({
                            result: false,
                            message
                        });
                    } else 
                        resolve({
                            result: true,
                            message: ''
                        });
                });
            });
        })
};
