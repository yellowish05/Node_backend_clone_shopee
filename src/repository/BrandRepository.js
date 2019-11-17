function getSearchQueryByName(query) {
  return { name: { $regex: `^${query}.*`, $options: 'i' } };
}

class BrandRepository {
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
}

module.exports = BrandRepository;
