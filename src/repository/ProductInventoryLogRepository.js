const { turn } = require('../model/LiveStreamExperienceModel');

class ProductRepository {
  constructor(model) {
    this.model = model;
  }

  async add(data) {
    const product = new this.model(data);
    return product.save();
  }

  async getQuantityByProductId(id) {
    return this.model.aggregate([
      { $match: { product: id } },
      {
        $group: {
          _id: null,
          quantity: { $sum: '$shift' },
        },
      },
    ])
      .then(([{ quantity }]) => quantity);
  }

  async decreaseQuantity(id, quantity) {
    try {
      const product = this.model.findOne({ _id: id });
      product.quantity -= quantity;
      try {
        return product.save();
      } catch (err) {
        throw new Error(err);
      }
    } catch (err) {
      throw new Error(err);
    }
  }

  async checkAmount(id, quantity) {
    try {
      const product = this.model.findOne({ _id: id });
      if (product.quantity - quantity < 1) return false;
      return true;
    } catch (err) {
      throw new Error(err);
    }
  }
}

module.exports = ProductRepository;
