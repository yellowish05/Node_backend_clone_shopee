const path = require('path');

const logger = require(path.resolve('config/logger'));

class PushNotificationService {
  pushNotification({ user, notification }) {
    logger.error('PushNotificationService.pushNotification({ user, notification }) Not implemented');
  }
}

module.exports = new PushNotificationService();
