/* eslint-disable no-param-reassign */
const uuid = require('uuid/v4');

class UserCartItemRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne({
    productId, productAttribute, billingAddress, deliveryRate,
  }, userId) {
    if (typeof productId !== 'string') {
      throw new Error(`UserCartItem.findOne expected id as String, but got "${typeof productId}"`);
    }
    if (typeof userId !== 'string') {
      throw new Error(`UserCartItem.findOne expected id as String, but got "${typeof userId}"`);
    }
    // if (typeof billingAddress !== 'string') {
    //   throw new Error(`UserCartItem.findOne expected id as String, but got "${typeof billingAddress}"`);
    // }
    // if (typeof deliveryRate !== 'string') {
    //   throw new Error(`UserCartItem.findOne expected id as String, but got "${typeof deliveryRate}"`);
    // }

    return productAttribute
      ? this.model.findOne({
        product: productId, productAttribute, user: userId, billingAddress, deliveryRate,
      })
      : this.model.findOne({
        product: productId, user: userId, billingAddress, deliveryRate,
      });
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

  async getItemsByUser(userId, selected = false) {
    const query = { user: userId };
    if (selected) query.selected = true;
    return this.model.find(query);
  }

  async add({
    productId, deliveryRateId, quantity, billingAddress, productAttribute, note,
  }, userId) {
    const query = { productId, productAttribute, billingAddress };
    if (deliveryRateId) {
      query.deliveryRate = deliveryRateId;
    }
    return this.findOne(query, userId)
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
          note,
        });
      });
  }

  async delete(itemId) {
    if (typeof itemId !== 'string') {
      throw new Error(`UserCartItem.delete expected id as String, but got "${typeof itemId}"`);
    }

    return this.model.deleteOne({ _id: itemId });
  }

  async update(userCartId, { deliveryRateId, quantity, note }) {
    return this.getById(userCartId)
      .then((cartItem) => {
        cartItem.quantity = quantity;
        cartItem.deliveryRate = deliveryRateId;
        cartItem.note = note;
        return cartItem.save();
        console.log({cartItem})
      });
  }

  async clear(userId, selected = null) {
    if (typeof userId !== 'string') {
      throw new Error(`UserCartItem.clear expected id as String, but got "${typeof userId}"`);
    }
    const query = { user: userId };
    if (typeof selected === 'boolean' && selected === true) {
      query.selected = true;
    }
    return this.model.deleteMany(query);
  }
}

module.exports = UserCartItemRepository;
