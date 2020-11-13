/* eslint-disable no-param-reassign */

module.exports = async (_, args, { dataSources: { repository }, user }) => repository.userCartItem
  .getAll({ user: user.id })
  .then((items) => {
    const productIds = items.map((item) => item.product).filter((id) => id !== null);
    const deliveryRateIds = items.map((item) => item.deliveryRate).filter((id) => id !== null);

    return Promise.all([
      repository.product.getByIds(productIds),
      repository.deliveryRate.getByIds(deliveryRateIds),
    ])
      .then(([products, deliveryRates]) => {
        const productsById = products.reduce((accumulator, product) => {
          accumulator[product.id] = product;
          return accumulator;
        }, {});

        const deliveryRatesById = deliveryRates.reduce((accumulator, deliveryRate) => {
          accumulator[deliveryRate.id] = deliveryRate;
          return accumulator;
        }, {});

        return items.map((item) => {
          if (item.product && productsById[item.product]) {
            item.product = productsById[item.product];
          }
          if (item.deliveryRate && deliveryRatesById[item.deliveryRate]) {
            item.deliveryRate = deliveryRatesById[item.deliveryRate];
          }
          return item;
        });
      })
      .then((itemsWithProps) => ({ items: itemsWithProps }));
  });
