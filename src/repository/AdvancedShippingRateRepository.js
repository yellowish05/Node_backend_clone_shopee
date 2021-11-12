/**
 * AdvancedShippingRateRepository
 */

const path = require("path");
const uuid = require("uuid/v4");

class AdvancedShippingRateRepository {
  constructor(model) {
    this.model = model;
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

  delete(id) {
    if (typeof itemId !== "string") {
      throw new Error(
        `AdvancedShippingRate.delete expected id as String, but got "${typeof itemId}"`
      );
    }

    return this.model.deleteOne({ _id: id });
  }
}

module.exports = AdvancedShippingRateRepository;
