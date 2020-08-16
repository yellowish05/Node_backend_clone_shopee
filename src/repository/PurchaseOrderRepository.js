const uuid = require('uuid/v4');

class PurchaseOrderRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getAll() {
    return this.model.find();
  }

  async find({ user }) {
    return await this.model.find({ buyer: user.id });
  }

  async getByBuyer(id) {
    return this.model.find({ buyer: id });
  }

  async findByTransactionId(id) {
    return this.model.findOne({ payments: id });
  }

  async create(data) {
    const document = new this.model({
      _id: uuid(),
      ...data,
    });
    return document.save();
  }
}

module.exports = PurchaseOrderRepository;
