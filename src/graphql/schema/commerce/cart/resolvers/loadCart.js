/* eslint-disable no-param-reassign */
const { ForbiddenError } = require('apollo-server');

module.exports = async (_, args, { dataSources: { repository }, user }) => repository.userCartItem
  .getAll({ user: user.id })
  .then((items) => Promise.all(items.map(async (item) => {
    item.product = await repository.product.getById(item.product)
      .then((product) => {
        if (!product) { throw new ForbiddenError(`Product with id "${item.product}" does not exist`); }

        return product;
      });
    item.deliveryRate = await repository.deliveryRate.getById(item.deliveryRate)
      .then((deliveryRate) => deliveryRate);
      console.log("item.discount",item.discount)
    if (item.discount) {
      item.discount = await repository.discount.getById(item.discount)
        .then((discount) => discount);
    }else{
      item.discount=null
    }
    if (item.productAttribute) {
      item.productAttribute = await repository.productAttributes.getById(item.productAttribute);
    }

    return item;
  }))
    .then((items) => ({ items })));
