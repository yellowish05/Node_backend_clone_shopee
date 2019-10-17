const uuid = require('uuid/v4');

class UserRepository {
  constructor({ model }) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ id });
  }

  async create(data) {
    if (!data.userId) {
      data.userId = uuid();
    }

    const user = new this.model({
      id: data.userId,
    });

    return user.save();
  }
}

module.exports = UserRepository;
