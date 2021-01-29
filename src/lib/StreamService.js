
const path = require('path');
const repository = require(path.resolve('src/repository'));


class StreamService {
  constructor(repository) {
    this.repository = repository;
  }

  async updateStreamStatus(liveStream, status) {
    if (!liveStream) return false;
    return this.repository.streamChannel.load(liveStream.channel)
      .then(streamChannel => {
        streamChannel.status = liveStream.status = status;
        return Promise.all([ liveStream.save(), streamChannel.save() ]);
      })
  }

  async updateStreamStatusByStream(liveStreamId, status) {
    return this.repository.liveStream.load(liveStreamId)
      .then(liveStream => this.updateStreamStatus(liveStream, status));
  }

  async updateStreamStatusByChannel(streamChannelId, status) {
    return this.repository.liveStream.getOne({ channel: streamChannelId })
      .then(liveStream => this.updateStreamStatus(liveStream, status));
  }
}


module.exports = new StreamService(repository);