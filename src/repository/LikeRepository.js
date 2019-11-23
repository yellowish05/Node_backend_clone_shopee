class LikeRepository {
  constructor(model) {
    this.model = model;
  }

  async load(entityId, userId) {
    return this.model.findOne({ entity: entityId, user: userId });
  }

  async toggleLike(entityId, userId) {
    return this.model.findOneAndRemove({ entity: entityId, user: userId })
      .then((like) => (like || this.model.create({ entity: entityId, user: userId })));
  }

  async getLikesCount(entityId) {
    return this.model.countDocuments({ entity: entityId });
  }
}

module.exports = LikeRepository;
