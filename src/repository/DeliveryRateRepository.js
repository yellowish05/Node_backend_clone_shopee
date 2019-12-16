/* eslint-disable no-param-reassign */

class DeliveryRateRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async create(data) {
    const addressCache = new this.model(data);
    return addressCache.save();
  }
}

module.exports = DeliveryRateRepository;
