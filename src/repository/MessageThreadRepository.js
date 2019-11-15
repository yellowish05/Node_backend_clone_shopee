const uuid = require('uuid/v4');

class MessageThreadRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne(id) {
    return this.model.findOne({ _id: id });
  }

  async findByIds(ids) {
    if (!ids) {
      return [];
    }

    if (!Array.isArray(ids)) {
      throw new Error(`MessageThread.findByIds expected ids as Array, but got "${typeof ids}"`);
    }

    if (ids.length === 0) {
      return [];
    }

    return this.model.find({ _id: { $in: ids } });
  }

  async findByIdsAndParticipants(ids, participants) {
    if (!Array.isArray(ids)) {
      throw new Error(`MessageThread.findByIdsAndParticipants expected ids as array, but got "${typeof ids}"`);
    }

    if (!Array.isArray(participants)) {
      throw new Error(`MessageThread.findByIdsAndParticipants expected participents as Array, but got "${typeof participants}"`);
    }

    const query = {
      $and: [
        { _id: { $in: ids } },
      ],
    };

    query.$and = query.$and.concat(
      participants.map((id) => ({ participants: { $eq: id } })),
    );
    return this.model.findOne(query);
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
