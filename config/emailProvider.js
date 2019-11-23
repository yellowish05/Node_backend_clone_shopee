const { client: EmailClient } = require('elasticemail-webapiclient');
const { email } = require('./index');
const logger = require('./logger');

if (email.elasticEmailOptions.apiKey == null) {
  logger.warn("You didn't provided APP_KEY for Elastic Email. You will not be able to send emails");
}

const client = new EmailClient(email.elasticEmailOptions);

client.Account.Load()
  .then((response) => {
    logger.debug(JSON.stringify(response));
  });

module.exports = client;
