const path = require('path');
const { Validator } = require('node-input-validator');

const { ApolloError, UserInputError, ForbiddenError } = require('apollo-server');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();
const https = require('https');
var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Authorization": "Basic MWI4NGM3ZjYtNmJlMC00OGUyLWFiMjktY2I0Mjk3Yzk2MjQz"
};
  
var options = {
    host: "onesignal.com",
    port: 443,
    path: "/api/v1/notifications",
    method: "POST",
    headers: headers
};

module.exports = (_, args, { dataSources: { repository }, user }) => {
    const validator = new Validator(args,
      { message: 'required' });
  
    return validator.check()
        .then(async (matched) => {
            if (!matched) {
                throw errorHandler.build(validator.errors);
            }
        })
        .then(() => {
            var notificationInfo = { 
                app_id: "c7da1af0-cc12-47db-bf55-5d8de3d47848",
                contents: {"en": args.message},
                included_segments: ["All"]
            };
            var req = https.request(options, function(res) {  
                res.on('data', function(data) {
                    console.log("Response:");
                    console.log(JSON.parse(data));
                });
            });
              
            req.on('error', function(e) {
                console.log("ERROR:");
                console.log(e);
                throw new ForbiddenError('Push notification server error');
            });
              
            req.write(JSON.stringify(notificationInfo));
            req.end();
            return true;
        })
        .catch((error) => {
            throw new ApolloError(`Failed to read Notification. Original error: ${error.message}`, 400);
        });
};