const path = require('path');

const { Currency, PushNotification, MeasureSystem } = require(path.resolve('src/lib/Enums'));
const md5 = require('md5');

class UserRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async loadList(ids) {
    return this.model.find({ _id: { $in: ids } });
  }

  async create(data, options = {}) {
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
        language: 'EN',
        currency: Currency.USD,
        measureSystem: MeasureSystem.USC,
      },
    });

    return user.save();
  }

  async createByProvider(data, options = {}) {
    if (!data.email) {
      throw Error('Email is required!');
    }

    if (data.email && await this.findByEmail(data.email)) {
      throw Error(`Email "${data.email}" is already taken!`);
    }

    const user = new this.model({
      _id: data._id,
      email: data.email,
      name: data.name,
      photo: data.photo,
      roles: options.roles || [],
      settings: {
        pushNotifications: PushNotification.toList(),
        language: 'EN',
        currency: Currency.USD,
        measureSystem: MeasureSystem.USC,
      },
      providers: { [data.provider]: data.providerId },
    });

    return user.save();
  }

  async update(id, data) {
    const user = await this.load(id);
    if (!user) {
      throw Error(`User "${id}" does not exist!`);
    }

    user.name = data.name || user.name;
    user.phone = data.phone || user.phone;
    user.photo = data.photo || user.photo;
    user.location = data.location || user.location;
    user.address = data.address || user.address;

    if (data.provider && data.providerId) {
      user.providers[data.provider] = data.providerId;
    }

    return user.save();
  }

  async updateSettings(id, settings) {
    const user = await this.load(id);
    if (!user) {
      throw Error(`User "${id}" does not exist!`);
    }

    user.settings = settings;

    return user.save();
  }

  async findByEmailAndPassword({ email, password }) {
    const query = {
      password: md5(password),
      email,
    };

    return this.model.findOne(query);
  }

  async findByEmail(email) {
    return this.model.findOne({ email });
  }

  async findByProvider(provider, value) {
    return this.model.findOne({ [`providers.${provider}`]: value });
  }

  async changePassword(userId, password) {
    return this.model.findOneAndUpdate(
      { _id: userId },
      { $set: { password: md5(password) } },
      { new: true },
    );
  }

  async approveEmail(userId) {
    return this.model.findOneAndUpdate(
      { _id: userId },
      { $set: { isApprovedEmail: true } },
      { new: true },
    );
  }

  async addToBlackList(userId, reportedId) {
    return this.model.update(
      { _id: userId },
      { $push: { blackList: reportedId } },
    );
  }
}

module.exports = UserRepository;
