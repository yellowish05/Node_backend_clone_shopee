const uuid = require('uuid/v4');

class StreamSourceRepository {
  constructor(model) {
    this.model = model;
  }

  async getByID(id) {
    return this.model.findOne({ _id: id });
  }

  async getByLanguage(lang) {
    return this.model.find({language: lang});
  }
}

module.exports = StreamSourceRepository;
