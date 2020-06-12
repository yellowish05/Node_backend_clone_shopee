const { turn } = require('../model/LiveStreamExperienceModel');

class ProductRepository {
  constructor(model) {
    this.model = model;
  }

  async add(data) {
    let product = this.model.findOne(data.product);
    try {
      product.shift += data.shift;
      return product.save();
    } catch {
      product = new this.model(data);
      return product.save();
    }
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
      const product = this.model.findOne({ product: id });
      product.shift -= quantity;
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
      const product = this.model.findOne({ product: id });
      if (product.shift - quantity < 1) return false;
      return true;
    } catch (err) {
      throw new Error(err);
    }
  }
}

module.exports = ProductRepository;
