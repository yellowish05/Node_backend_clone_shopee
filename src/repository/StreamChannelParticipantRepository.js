
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

  async getParticipantActiveChannels(userId) {
    return this.model.find({ user: userId, leavedAt: null });
  }

  async getViewersCount(channelId) {
    return this.model.count({ channel: channelId, leavedAt: null, isPublisher: false });
  }

  async leaveStream(channelId, userId) {
    return this.model.findOneAndUpdate(
      { channel: channelId, user: userId },
      { leavedAt: Date.now() },
      { new: true },
    );
  }
}

module.exports = StreamChannelParticipantRepository;
