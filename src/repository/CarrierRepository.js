const uuid = require('uuid/v4');

class CarrierRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getAll(query = {}) {
    return this.model.find(query).sort({ name: 1 });
  }

  async loadList(ids) {
    return this.model.find({ _id: { $in: ids } });
  }

  async getByName(name) {
    return this.model.findOne({ name });
  }

  async addByName(data) {
    const card = new this.model({
      _id: uuid(),
      ...data,
    });
    return card.save();
  }
}

module.exports = CarrierRepository;
