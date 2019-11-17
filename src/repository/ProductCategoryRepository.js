function getSearchQueryByName(query) {
  return { name: { $regex: `^${query}.*`, $options: 'i' } };
}

class ProductCategoryRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByParent(id) {
    return this.model.find({ parent: id });
  }

  async findByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async searchByName(query, { skip, limit }) {
    return this.model.find(
      getSearchQueryByName(query),
      null,
      { limit, skip },
    );
  }

  async getCountBySearch(query) {
    return this.model.countDocuments(getSearchQueryByName(query));
  }

  async getCountByParent(parent) {
    return this.model.countDocuments({ parent });
  }
}

module.exports = ProductCategoryRepository;
