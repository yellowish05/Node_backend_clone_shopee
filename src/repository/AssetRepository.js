const uuid = require('uuid/v4');

class AssetRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const asset = new this.model(data);
    return asset.save();
  }
}

module.exports = AssetRepository;
