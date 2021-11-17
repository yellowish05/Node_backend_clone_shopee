/**
 * AdvancedShippingRateRepository
 */

const path = require("path");
const uuid = require("uuid/v4");

class AdvancedShippingRateRepository {
  constructor(model) {
    this.model = model;
  }

  create(data) {
    if (!data._id) data = { ...data, _id: uuid() };
    const rule = new this.model(data);
    return rule.save();
  }

  getById(id) {
    return this.model.findOne({ _id: id });
  }

  getByIds(ids) {
    return this.model.find({ _id: ids });
  }

  getByOwner(owner) {
    return this.model.find({ owner });
  }

  getByRule(rule) {
    return this.model.find({ rule });
  }

  delete(id) {
    if (typeof id !== "string") {
      throw new Error(
        `AdvancedShippingRate.delete expected id as String, but got "${typeof itemId}"`
      );
    }

    return this.model.deleteOne({ _id: id });
  }

  deleteByRule(rule) {
    if (typeof rule !== "string") {
      throw new Error(
        `AdvancedShippingRate.deleteByRule expected id as string, but got "${typeof rule}"`
      );
    }

    return this.model.deleteMany({ rule });
  }
}

module.exports = AdvancedShippingRateRepository;
