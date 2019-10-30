const uuid = require('uuid/v4');

class LikeRepository {
  constructor(model) {
    this.model = model;
  }

  async load(entityId, userId) {
    return this.model.findOne({ entity: entityId, user: userId });
  }

  async toggleLike(entityId, userId) {
    return this.model.findOneAndRemove({ entity: entityId, user: userId })
      .then((like) => (like || this.model.create({ _id: uuid(), entity: entityId, user: userId })));
  }

  async getLikesCount(entityId) {
    return this.model.count({ entity: entityId });
  }
}

module.exports = LikeRepository;
