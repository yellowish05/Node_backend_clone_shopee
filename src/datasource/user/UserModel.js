const mongoose = require('mongoose');
const schema = require('./UserSchema');

module.exports = new mongoose.model('User', schema);
