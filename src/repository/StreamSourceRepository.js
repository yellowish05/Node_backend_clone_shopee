const uuid = require('uuid/v4');

class StreamSourceRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const source = new this.model({
      ...data,
      _id: uuid(),
    });

    return source.save();
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }
}

module.exports = StreamSourceRepository;
