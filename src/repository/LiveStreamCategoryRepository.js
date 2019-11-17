function getSearchQueryByName(query) {
  return { name: { $regex: `^${query}.*`, $options: 'i' } };
}

class LiveStreamCategoryRepository {
  constructor(model) {
    this.model = model;
  }

  async searchByName(query, { skip, limit }) {
    return this.model.find(
      getSearchQueryByName(query),
      null,
      {
        limit,
        skip,
      },
    );
  }

  async getCountBySearch(query) {
    return this.model.count(getSearchQueryByName(query));
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getAll() {
    return this.model.find();
  }
}

module.exports = LiveStreamCategoryRepository;
