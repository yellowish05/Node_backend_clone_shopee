const path = require('path');
const uuid = require("uuid/v4");

const { Currency, PushNotification, MeasureSystem, LanguageList } = require(path.resolve('src/lib/Enums'));

class ThemeRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByIds(ids) {
    return this.model.find({ _id: { $in: ids } });
  }

  async getByName(name) {
    return this.model.findOne({ name });
  }

  async loadAll() {
    return this.model.find();
  }

  async create(data) {
    if (!data._id) data = { ...data, _id: uuid() };
    const theme = new this.model(data);

    return theme.save();
  }

  async deleteById(itemId) {
    if (typeof itemId !== 'string') {
      throw new Error(`Theme.delete expected id as String, but got "${typeof itemId}"`);
    }

    return this.model.deleteOne({ _id: itemId });
  }
}

module.exports = ThemeRepository;
