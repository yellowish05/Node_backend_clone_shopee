
class LiveStreamRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ id });
  }

  async create(data) {
    const liveStream = new this.model(data);

    return liveStream.save();
  }

  async getAll(query = {}) {
    return this.model.find(query).populate('streamer viewers preview');
  }

  async getById(id) {
    return this.model.findOne({ id }).populate('streamer viewers preview');
  }
}

module.exports = LiveStreamRepository;
