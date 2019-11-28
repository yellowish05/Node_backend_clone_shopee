/* eslint-disable global-require */
const path = require('path');

const { payment } = require(path.resolve('config'));

const providers = {
  WIRECARD: require('./providers/WireCard'),
};

if (payment.testMode) {
  providers.FAKE = require('./providers/Fake');
}

module.exports = {
  providers,
};
