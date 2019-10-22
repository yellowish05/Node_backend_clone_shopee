
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

  async getAll() {
    return this.model.find().populate('streamer viewers preview');
  }

  async getById(id) {
    return this.model.findById({ id }).populate('streamer viewers preview');
  }
}

module.exports = LiveStreamRepository;
