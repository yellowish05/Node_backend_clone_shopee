/* eslint-disable no-param-reassign */
const path = require('path');
const BaseRobot = require('./BaseRobot');

const logger = require(path.resolve('config/logger'));
const { robots } = require(path.resolve('config'));
const { StreamChannelStatus } = require(path.resolve('src/lib/Enums'));
const LiveStreamModel = require(path.resolve('src/model/LiveStreamModel'));

module.exports = class CancelLiveStreamRobot extends BaseRobot {
  constructor() {
    super(5 * 60 * 1000);
  }

  execute() {
    LiveStreamModel.find(
      {
        status: StreamChannelStatus.PENDING,
        createdAt: { $lte: new Date(Date.now() - robots.cancelLiveStreamIn) },
      },
    ).then((liveStreams) => Promise.all(liveStreams.map((liveStream) => {
      liveStream.status = StreamChannelStatus.CANCELED;
      return liveStream.save().then(() => logger.info(`${this.label} Live Stream (${liveStream.id}) was canceled`));
    })))
      .then(() => {
        super.execute();
      });
  }
};
