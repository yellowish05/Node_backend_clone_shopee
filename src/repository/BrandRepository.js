const uuid = require('uuid/v4');

function getSearchQueryByName(query) {
  return query ? { name: { $regex: `${query}`, $options: 'i' } } : {};
}

class BrandRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByIds(ids) {
    return this.model.findOne({ _id: ids });
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

  async findByName(name) {
    return await this.model.findOne({ name: name })
  }

  async create(data) {
    const brand = new this.model(data);
    return brand.save();
  }

  async getCountBySearch(query) {
    return this.model.countDocuments(getSearchQueryByName(query));
  }

  async findOrCreate(data) {
    const brand = await this.findByName(data.name);

    if (brand) {
      return brand;
    } else {
      return await this.create({ _id: uuid(), name: data.name });
    }
  }

  async getByCategoryAndTags(categoryIds = [], tags = []) {
    const query = {};
    const $or = [];
    if (Array.isArray(categoryIds) && categoryIds.length) {
      const $orCategory = [];
      categoryIds.forEach(categoryId => {
        $orCategory.push({ brandCategories: categoryId });
      })
      $or.push({ $or: $orCategory });
    }

    if (Array.isArray(tags) && tags.length) {
      const $orTags = [];
      tags.forEach(tag => {
        $orTags.push({ hashtags: { $regex: `${tag}`, $options: 'i' } });
      });
      $or.push({$or: $orTags});
    }
    if ($or.length) query.$or = $or;
    return this.model.find(query);
  }
}

module.exports = BrandRepository;