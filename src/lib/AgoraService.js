const { AccessToken } = require('agora-access-token');

const { Token, Priviledges } = AccessToken;
const { StreamRole } = require('./Enums');
const { agora } = require('../../config');
const logger = require('../../config/logger');

if (agora.app_id == null) {
  logger.warn("You didn't provided APP_ID for Agora. You will not be able to work with streams");
}

if (agora.app_cert == null) {
  logger.warn("You didn't provided APP_CERT for Agora. You will not be able to work with streams");
}

module.exports.AgoraService = {
  buildTokenWithAccount(channelName, account, role, privilegeExpiredTs = 0) {
    this.key = new Token(agora.app_id, agora.app_cert, channelName, account);
    this.key.addPriviledge(Priviledges.kJoinChannel, privilegeExpiredTs);
    if (role === StreamRole.PUBLISHER) {
      this.key.addPriviledge(Priviledges.kPublishAudioStream, privilegeExpiredTs);
      this.key.addPriviledge(Priviledges.kPublishVideoStream, privilegeExpiredTs);
      this.key.addPriviledge(Priviledges.kPublishDataStream, privilegeExpiredTs);
    }
    return this.key.build();
  },
};
