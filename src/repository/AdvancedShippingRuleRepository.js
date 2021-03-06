/**
 * AdvancedShippingRuleRepository
 */

const path = require("path");
const uuid = require("uuid/v4");

// isActive: null - return all, for owners
// isActive: true - return active rules, when calculating shipping price.
function considerActive(query, isActive) {
  if (typeof isActive === "boolean") {
    query.isActive = isActive;
  }
}

class AdvancedShippingRuleRepository {
  constructor(model) {
    this.model = model;
  }

  create(data) {
    if (!data._id) data = { ...data, _id: uuid() };
    const rule = new this.model(data);
    return rule.save();
  }

  getById(id, isActive = null) {
    const query = { _id: id };
    considerActive(query, isActive);
    return this.model.findOne(query);
  }

  getByIds(ids, isActive = null) {
    const query = { _id: ids };
    considerActive(query, isActive);
    return this.model.find(query);
  }

  getByOwner(owner, isActive = null) {
    const query = { owner };
    considerActive(query, isActive);
    return this.model.find(query);
  }

  delete(id) {
    if (typeof id !== "string") {
      throw new Error(
        `AdvancedShippingRule.delete expected id as String, but got "${typeof itemId}"`
      );
    }

    return this.model.deleteOne({ _id: id });
  }
}

module.exports = AdvancedShippingRuleRepository;
