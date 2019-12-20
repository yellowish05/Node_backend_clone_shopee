const uuid = require('uuid/v4');

class PaymentMethodRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const doc = new this.model({
      ...data,
      _id: uuid(),
    });
    return doc.save();
  }

  async getActiveMethods(user) {
    if (!user || !['string', 'object'].includes(typeof user)) {
      throw new Error(`PaymentMethod.getActiveMethods expects "user" but gets "${typeof user}"`);
    }

    const query = {
      user,
      isActive: true,
    };
    return this.model.find(query).sort({ usedAt: -1 });
  }
}

module.exports = PaymentMethodRepository;
