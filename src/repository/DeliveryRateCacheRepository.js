/* eslint-disable no-param-reassign */
const uuid = require('uuid/v4');

class DeliveryRateCacheRepository {
  constructor(model) {
    this.model = model;
  }

  async get(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const addressCache = new this.model({
      _id: uuid(),
      ...data,
    });
    return addressCache.save();
  }
}

module.exports = DeliveryRateCacheRepository;
