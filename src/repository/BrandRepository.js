const uuid = require('uuid/v4');

function getSearchQueryByName(query) {
  return query ? { name: { $regex: `^${query}.*`, $options: 'i' } } : {};
}

class BrandRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
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

}

module.exports = BrandRepository;