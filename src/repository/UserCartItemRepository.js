const uuid = require('uuid/v4');

class UserCartItemRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne({ productId }, userId) {
    if (typeof productId !== 'string') {
      throw new Error(`UserCartItem.findOne expected id as String, but got "${typeof productId}"`);
    }
    if (typeof userId !== 'string') {
      throw new Error(`UserCartItem.findOne expected id as String, but got "${typeof userId}"`);
    }

    return this.model.findOne({ product: productId, user: userId });
  }

  async getById(userCartId) {
    return this.model.findOne({ _id: userCartId });
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }

  async add({ productId }, userId, quantity) {
    return this.findOne({ productId }, userId)
      .then((cartItem) => {
        if (cartItem) {
          cartItem.quantity += quantity;
          return cartItem.save();
        }

        return this.model.create({
          _id: uuid(), product: productId, user: userId, quantity,
        });
      });
  }

  async delete(userCartId) {
    if (typeof userCartId !== 'string') {
      throw new Error(`UserCartItem.delete expected id as String, but got "${typeof userCartId}"`);
    }

    return this.model.deleteOne({ _id: userCartId });
  }

  async update(userCartId, quantity) {
    return this.getById(userCartId)
      .then((cartItem) => {
        cartItem.quantity = quantity;
        return cartItem.save();
      });
  }

  async clear(userId) {
    if (typeof userId !== 'string') {
      throw new Error(`UserCartItem.clear expected id as String, but got "${typeof userId}"`);
    }

    return this.model.deleteMany({ user: userId });
  }
}

module.exports = UserCartItemRepository;
