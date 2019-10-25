
class StreamChannelRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const channel = new this.model(data);

    return channel.save();
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }

  async update(id, data) {
    const channel = await this.load(id);
    if (!channel) {
      throw Error(`Stream Channel "${id}" does not exist!`);
    }

    channel.status = data.status || channel.status;
    channel.startedAt = data.startedAt || channel.startedAt;
    channel.finishedAt = data.finishedAt || channel.finishedAt;

    return channel.save();
  }
}

module.exports = StreamChannelRepository;
