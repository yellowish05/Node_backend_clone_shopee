/* eslint-disable no-param-reassign */
const uuid = require('uuid/v4');

class UserCartItemRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne({ productId, productAttribute }, userId) {
    if (typeof productId !== 'string') {
      throw new Error(`UserCartItem.findOne expected id as String, but got "${typeof productId}"`);
    }
    if (typeof userId !== 'string') {
      throw new Error(`UserCartItem.findOne expected id as String, but got "${typeof userId}"`);
    }

    return productAttribute ? 
      this.model.findOne({ product: productId, productAttribute, user: userId }) : 
      this.model.findOne({ product: productId, productuser: userId })
  }

  async getById(itemId) {
    return this.model.findOne({ _id: itemId });
  }

  /**
   * @deprecated
   */
  async getAll(query = {}) {
    return this.model.find(query);
  }

  async getItemsByUser(userId) {
    return this.model.find({ user: userId });
  }

  async add({
    productId, deliveryRateId, quantity, billingAddress, productAttribute,
  }, userId) {
    return this.findOne({ productId, productAttribute }, userId)
      .then((cartItem) => {
        if (cartItem) {
          cartItem.quantity += quantity;
          cartItem.deliveryRate = deliveryRateId;
          return cartItem.save();
        }

        return this.model.create({
          _id: uuid(),
          product: productId,
          deliveryRate: deliveryRateId,
          user: userId,
          quantity,
          billingAddress,
          productAttribute,
        });
      });
  }

  async delete(itemId) {
    if (typeof itemId !== 'string') {
      throw new Error(`UserCartItem.delete expected id as String, but got "${typeof itemId}"`);
    }

    return this.model.deleteOne({ _id: itemId });
  }

  async update(userCartId, { deliveryRateId, quantity }) {
    return this.getById(userCartId)
      .then((cartItem) => {
        cartItem.quantity = quantity;
        cartItem.deliveryRate = deliveryRateId;
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
