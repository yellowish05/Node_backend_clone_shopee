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
}

module.exports = ProductRepository;
