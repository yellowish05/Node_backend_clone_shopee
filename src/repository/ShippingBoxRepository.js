const uuid = require('uuid/v4');

class ShippingBoxRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne(id, includeDeleted = false) {
    const query = { _id: id };
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    return this.model.findOne(query);
  }

  async create(data) {
    const shippingBox = new this.model({
      _id: uuid(),
      ...data,
    });
    return shippingBox.save();
  }

  async remove(id) {
    return this.model.update({ _id: id }, { isDeleted: true });
  }

  async getAll(query) {
    return this.model.find({ ...query, isDeleted: false });
  }
}

module.exports = ShippingBoxRepository;
