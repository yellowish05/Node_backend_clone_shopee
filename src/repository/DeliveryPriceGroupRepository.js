const uuid = require('uuid/v4');

class DeliveryPriceGroupRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    const document = new this.model({
      ...data,
      _id: data._id || uuid(),
    });
    return document.save();
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByIds(ids) {
    return this.model.find({ _id: { $in: ids } });
  }
}

module.exports = DeliveryPriceGroupRepository;
