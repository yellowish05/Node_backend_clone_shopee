
module.exports = async (_, {
  filter, page, sort, currency,
}, { dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  return Promise.all([
    repository.product.get({ filter, page, sort }),
    repository.product.getTotal(filter),
  ])
    .then(([collection, total]) => ({
      collection,
      pager: { ...pager, total },
    }));
};
