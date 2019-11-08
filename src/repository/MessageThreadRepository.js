const uuid = require('uuid/v4');

class MessageThreadRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const message = new this.model({
      _id: uuid(),
      ...data,
    });
    return message.save();
  }
}

module.exports = MessageThreadRepository;
