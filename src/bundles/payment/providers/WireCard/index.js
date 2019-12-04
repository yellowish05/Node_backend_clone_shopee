/* eslint-disable class-methods-use-this */
const path = require('path');
const Provider = require('./Provider');

const { payment: { providers: { wirecard } } } = require(path.resolve('config'));

module.exports = new Provider(wirecard);
