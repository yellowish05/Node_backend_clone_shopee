const path = require('path');

const logger = require(path.resolve('config/logger'));
const { oneSignal } = require(path.resolve('config'));
const https = require('https');

var headers = {
  "Content-Type": "application/json", //; charset=utf-8
  "Authorization": "Basic " + oneSignal.restApi_key
};

var options = {
  host: "onesignal.com",
  port: 443,
  path: "/api/v1/notifications",
  method: "POST",
  headers: headers
};

class PushNotificationService {
  pushNotification({ user, notification }) {
    logger.error('PushNotificationService.pushNotification({ user, notification }) Not implemented');
  }

  sendPushNotification({ message, device_ids }) {
    console.log("device id =>", device_ids);
    
    var notificationInfo = (device_ids == "All") ? { 
      app_id: oneSignal.app_id,
      contents: {"en": message},
      included_segments: ["All"],
      small_icon: "logo"
    } : { 
      app_id: oneSignal.app_id,
      contents: {"en": message},
      include_player_ids: device_ids,
      small_icon: "logo"
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
  }
}

module.exports = new PushNotificationService();
