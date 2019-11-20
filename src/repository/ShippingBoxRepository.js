const uuid = require('uuid/v4');

class ShippingBoxRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const shippingBox = new this.model({
      _id: uuid(),
      ...data,
    });
    return shippingBox.save();
  }

  async remove(id) {
    return this.model.deleteOne({ _id: id });
  }

  async getAll(query) {
    return this.model.find(query);
  }
}

module.exports = ShippingBoxRepository;
