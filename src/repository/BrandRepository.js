function getSearchQueryByName(query) {
  return { name: { $regex: `^${query}.*`, $options: 'i' } };
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
    return this.model.findOne({ name: name })
  }

  async create(data) {
    const brand = new this.model(data);
    return brand.save();
  }

  async getCountBySearch(query) {
    return this.model.countDocuments(getSearchQueryByName(query));
  }

  async findOrCreate(data) {
    if (await this.findByName(data.name)) {
      return await this.findByName(data.name)
    } else {
      return this.create({ _id: uuid(), name: data.name });
    }
  }

}

module.exports = BrandRepository;
