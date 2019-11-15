const uuid = require('uuid/v4');

class UserHasMessageThreadRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne(threadId, userId) {
    if (typeof threadId !== 'string') {
      throw new Error(`UserHasMessageThread.findOne expected id as String, but got "${typeof threadId}"`);
    }
    if (typeof userId !== 'string') {
      throw new Error(`UserHasMessageThread.findOne expected id as String, but got "${typeof userId}"`);
    }

    return this.model.findOne({ thread: threadId, user: userId });
  }

  async create(data) {
    const userHasMessageThread = new this.model({
      _id: uuid(),
      ...data,
    });
    return userHasMessageThread.save();
  }

  async updateTime(threadId, userId, time) {
    if (typeof threadId !== 'string') {
      throw new Error(`UserHasMessageThread.findOne expected id as String, but got "${typeof threadId}"`);
    }
    if (typeof userId !== 'string') {
      throw new Error(`UserHasMessageThread.findOne expected id as String, but got "${typeof userId}"`);
    }

    return this.model.findOneAndUpdate(
      {
        thread: threadId,
        user: userId,
      },
      {
        readBy: time,
      },
      {
        new: true,
      },
    );
  }
}

module.exports = UserHasMessageThreadRepository;
