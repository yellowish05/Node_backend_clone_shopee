
class CountryRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getAll() {
    return this.model.find().sort({ name: 1 });
  }
}

module.exports = CountryRepository;
