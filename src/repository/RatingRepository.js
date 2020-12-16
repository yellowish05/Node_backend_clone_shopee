class RatingRepository {
  constructor(model) {
    this.model = model;
  }

  async load(tag, userId) {
    return this.model.findOne({ tag, user: userId });
  }

  async create(data) {
    return this.model.findOneAndRemove({ tag: data.tag, user: data.user })
      .then(() => this.model.create(data));
  }

  async getAverage(tag) {
    return this.model.aggregate([
      {
        $match: { tag },
      },
      {
        $group:
          {
            _id: '$tag',
            value: { $avg: '$rating' },
          },
      },
    ]).then((rating) => (rating.length > 0 ? rating[0].value : 0));
  }

  async getTotal(tag) {
    return this.model.countDocuments({ tag });
  }
}

module.exports = RatingRepository;
