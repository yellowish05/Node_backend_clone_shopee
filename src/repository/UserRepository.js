const path = require('path');
// const stream = require('getstream');

const { Currency, PushNotification, MeasureSystem, LanguageList } = require(path.resolve('src/lib/Enums'));
const { chat: { getstream } } = require(path.resolve('config/index'));

// const client = stream.connect(getstream.api_key, getstream.api_secret, getstream.app_id, { location: getstream.location });
const StreamChat = require('stream-chat').StreamChat;
const clientSC = new StreamChat(getstream.api_key, getstream.api_secret);


const md5 = require('md5');

function elasticFilter(filter) {
  const emptyQuery = {};
  const query = {
    $and: [],
  };
  if (filter) {
    query.$and.push({
      $or: [
        { email: { $regex: `^.*${filter}.*`, $options: 'i' } },
        { name: { $regex: `^.*${filter}.*`, $options: 'i' } },
      ]
    })
  }
  return query.$and.length > 0 ? query : emptyQuery;
}

class UserRepository {
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
      streamToken: clientSC.createToken(data._id),
    });

    return user.save();
  }

  async createByPhone(data, options = {}) {
    if (!data.phone) {
      throw Error('phone is required!');
    }

    if (!data.countryCode) {
      throw Error('countryCode is required!');
    }

    if (data.phone && await this.findByPhone(data.phone)) {
      throw Error(`Phone Number "${data.phone}" is already taken!`);
    }

    const user = new this.model({
      _id: data._id,
      email: data.email,
      password: md5(data.password),
      phone: data.phone,
      roles: options.roles || [],
      settings: {
        pushNotifications: PushNotification.toList(),
        language: LanguageList.ENG,
        currency: Currency.USD,
        measureSystem: MeasureSystem.USC,
      },
      address: {
        country: data.countryCode,
      },
    });

    return user.save();
  }

  async createFromCsv(data, options = {}) {
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
      photo: data.photo.id,
      password: md5(data.password),
      phone: data.number,
      name: data.name,
      roles: data.roles || [],
      address: data.address,
      location: data.location,
      settings: {
        pushNotifications: PushNotification.toList(),
        language: data.settings.language,
        currency: data.settings.currency,
        measureSystem: data.settings.measureSystem,
      },
      phone: data.phone
    });

    return user.save();
  }

  async createByProvider(data, options = {}) {
    const {
      email,
      ...userProperties
    } = data;

    data = { email: email ? email.toLowerCase() : null, ...userProperties };
    // if (!data.email) {
    //   throw Error('Email is required!');
    // }

    if (data.email && await this.findByEmail(data.email)) {
      throw Error(`Email "${data.email}" is already taken!`);
    }
    let user;
    if(!data.email) {
      user = new this.model({
        _id: data._id,
        name: data.name,
        photo: data.photo,
        roles: options.roles || [],
        settings: {
          pushNotifications: PushNotification.toList(),
          language: LanguageList.EN,
          currency: Currency.USD,
          measureSystem: MeasureSystem.USC,
        },
        providers: { [data.provider]: data.providerId },
      });
    } else {
      user = new this.model({
        _id: data._id,
        email: data.email,
        name: data.name,
        photo: data.photo,
        roles: options.roles || [],
        settings: {
          pushNotifications: PushNotification.toList(),
          language: LanguageList.EN,
          currency: Currency.USD,
          measureSystem: MeasureSystem.USC,
        },
        providers: { [data.provider]: data.providerId },
      });
    }
    return user.save();
  }

  async update(id, data) {
    const {
      email,
      ...userProperties
    } = data;

    data = { email, ...userProperties };

    const user = await this.load(id);
    if (!user) {
      throw Error(`User "${id}" does not exist!`);
    }

    // getstream - name, image, role, favourite_color, book
    user.streamToken = clientSC.createToken(id);

    if (user.photo !== data.photo || user.name !== data.name) {
      try {
        await clientSC.updateUsers([{
          id: id,
          name: data.name || user.name || '',
          photo: data.photo || user.photo || ''
        }]);
      } catch (e) {

      }
    }

    // user.streamToken = clientSC.createToken(id);
    user.email = (!user.email && data.email) ? (data.email).toLowerCase() : user.email;
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

  async updateChatToken(user) {
    if (!user) return user;
    user.streamToken = clientSC.createToken(user._id);
    return user.save();
  }

  async setOnlineState(userId, status) {
    return this.model.findOneAndUpdate(
      { _id: userId },
      { $set: { isOnline: status } },
      { new: true },
    );
  }

  async updateCurrency(id, currency) {
    const user = await this.load(id);
    if (!user) {
      throw Error(`User "${id}" does not exist!`);
    }

    user.settings.currency = currency;

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

  async updateLangSetting(id, langCode) {
    const user = await this.load(id);
    if (!user) {
      throw Error(`user "${id}" does not exist!`);
    }
    user.settings.language = langCode;
    return user.save();
  }
  
  async updateEmailAndPassword(id, data) {
    const user = await this.load(id);
    if (!user) {
      throw Error(`User "${id}" does not exist!`);
    }

    user.email = data.email;
    user.password = md5(data.password);

    return user.save();
  }

  async findByEmailAndPassword({ email, password }) {
    const query = {
      password: md5(password),
      email: email.toLowerCase(),
    };

    return this.model.findOne(query);
  }

  async findByPhoneAndPassword({ phone, password }) {
    const query = {
      password: md5(password),
      phone: phone,
    };

    return this.model.findOne(query);
  }

  async findByEmail(email) {
    email = email.toLowerCase();
    return this.model.findOne({ email });
  }

  async findByPhone(phone) {
    return this.model.findOne({ phone });
  }

  async findByName(name) {
    return this.model.findOne({ name });
  }

  async findByProvider(provider, value) {
    return await this.model.findOne({ [`providers.${provider}`]: value });
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

  async changeDeviceId(userId, device_id) {
    return this.model.update(
      { _id: userId },
      { $set: { device_id } },
    );
  }

  async addToBlackList(userId, reportedId) {
    return this.model.update(
      { _id: userId },
      { $push: { blackList: reportedId } },
    );
  }

  async es_search(filter, page) {
    return this.model.find(
        elasticFilter(filter),
        null,
        {
          limit: page.limit,
          skip: page.skip,
        },
    );
  }

  async getTotal_es(filter) {
    return this.model
      .countDocuments(
        elasticFilter(filter),
      );
  }

  async updateOrganization(userID, org) {
    return this.model.findOne({ _id: userID, organization: org.id })
      .then(async (user) => {
        if (user) { return user; }

        const newUser = await this.getById(userID);
        newUser.organization = org.id;
        return newUser.save();
      });
  }
}

module.exports = UserRepository;
