const uuid = require('uuid/v4');

class LiveStreamTranslationRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id, isDeleted: false });
  }

  async getAll() {
    return this.model.find({});
  }

  async getByIds(ids) {
    return this.model.find({ _id: ids, isDeleted: false });
  }

  async getByLivestream(livestreamId) {
    return this.model.findOne({ livestream: livestreamId });
  }

  async addNewLivestream(data) {
    const newProduct = new this.model({ ...data, _id: uuid() });
    return newProduct.save();
  }

  async update(livestreamId, data) {
    const product = await this.getByLivestream(livestreamId);

    product.title = data.title || product.title;

    return product.save();
  }
}

module.exports = LiveStreamTranslationRepository;
