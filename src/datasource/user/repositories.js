const UserRepository = require('./UserRepository');
const userModel = require('./UserModel');

module.exports.user = new UserRepository(userModel);
