const eeClient = require('elasticemail-webapiclient').client;
const { email } = require('./index');
const logger = require('./logger');

if (email.elasticEmailOptions.apiKey == null) {
  logger.warn("You didn't provided APP_KEY for Elastic Email. You will not be able to send emails");
}

const EE = new eeClient(email.elasticEmailOptions);

module.exports = EE;
