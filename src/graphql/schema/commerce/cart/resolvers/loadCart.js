/* eslint-disable no-param-reassign */

module.exports = async (_, args, { dataSources: { repository }, user }) => repository.userCartItem
  .getAll({ user: user.id })
  .then((items) => {
    const productIds = items.map((item) => item.product).filter((id) => id !== null);

    return repository.product.findByIds(productIds)
      .then((products) => {
        const productsById = products.reduce((accumulator, product) => {
          accumulator[product.id] = product;
          return accumulator;
        }, {});

        return items.map((item) => {
          if (item.product && productsById[item.product]) {
            item.product = productsById[item.product];
          }
          return item;
        });
      })
      .then((itemsWithProducts) => ({ items: itemsWithProducts }));
  });
