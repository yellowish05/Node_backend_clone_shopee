const uuid = require('uuid/v4');

class PaymentStripeCustomerRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByUserId(id) {
    return this.model.findOne({ user: id });
  }

  async create(data) {
    const customer = new this.model({
      _id: uuid(),
      ...data,
    });
    return customer.save();
  }
}

module.exports = PaymentStripeCustomerRepository;
