const path = require('path');

const { Currency, PushNotification, MeasureSystem, LanguageList } = require(path.resolve('src/lib/Enums'));

class ThemeRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  /**
   * @deprecated
   */
  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async loadList(ids) {
    return this.model.find({ _id: { $in: ids } });
  }

  async loadAll() {
    return this.model.find();
  }

  async create(data, options = {}) {
    const {
      email,
      ...userProperties
    } = data;

    data = { email: email.toLowerCase(), ...userProperties };

    if (!data.email) {
      throw Error('Email is required!');
    }

    if (!data.password) {
      throw Error('Password is required!');
    }

    if (data.email && await this.findByEmail(data.email)) {
      throw Error(`Email "${data.email}" is already taken!`);
    }

    const user = new this.model({
      _id: data._id,
      email: data.email,
      password: md5(data.password),
      roles: options.roles || [],
      settings: {
        pushNotifications: PushNotification.toList(),
        language: LanguageList.EN,
        currency: Currency.USD,
        measureSystem: MeasureSystem.USC,
      },
    });

    return user.save();
  }
}

module.exports = ThemeRepository;
