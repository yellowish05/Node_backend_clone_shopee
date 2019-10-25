
class StreamChannelParticipantRepository {
  constructor(model) {
    this.model = model;
  }

  async load(channelId, userId) {
    return this.model.findOne({ channel: channelId, user: userId });
  }

  async create(data) {
    const participant = new this.model(data);

    return participant.save();
  }

  async getChannelParticipants(channelId) {
    return this.model.find({ channel: channelId });
  }

  async getActiveChannelParticipants(userId) {
    return this.model.find({ user: userId, leavedAt: null });
  }

  async leaveStream(channelId, userId) {
    return this.model.findOneAndUpdate({ channel: channelId, user: userId }, { leavedAt: Date.now() });
  }
}

module.exports = StreamChannelParticipantRepository;
