/* eslint-disable no-param-reassign */
function getSearchQueryByName({ query: keyword, isRecommended = null }) {
  const query = {};
  const $and = [];
  if (keyword) {
    $and.push({ name: { $regex: `^${keyword}.*`, $options: 'i' } });
  }
  if (typeof isRecommended === 'boolean') {
    $and.push({ isRecommended: isRecommended });
  }
  if ($and.length) {
    query.$and = $and;
  }
  return query;
}

class BrandCategoryRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    const brandCategory = new this.model(data);
    return brandCategory.save();
  }

  async getAll() {
    return this.model.find();
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async findByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async search(filter, { skip, limit }) {
    return this.model.find(
      getSearchQueryByName(filter),
      null,
      { limit, skip, sort: { order: 1 } },
    );
  }

  async getCountBySearch(filter) {
    return this.model.countDocuments(getSearchQueryByName(filter));
  }
}

module.exports = BrandCategoryRepository;
