const uuid = require('uuid/v4');

class SaleOrderRepository {
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
    return this.model.find({ seller: user.id });
  }

  async create(data) {
    const document = new this.model({
      _id: uuid(),
      ...data,
    });
    return document.save();
  }
}

module.exports = SaleOrderRepository;
