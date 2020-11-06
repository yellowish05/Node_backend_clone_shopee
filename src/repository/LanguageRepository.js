
class LanguageRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    console.log(id)
    return this.model.findOne({ _id: id });
  }

  async getAll() {
    return this.model.find().sort({ name: 1 });
  }

  async loadList(ids) {
    return this.model.find({ _id: { $in: ids } });
  }
}

module.exports = LanguageRepository;
