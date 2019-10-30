
module.exports = async (_, { filter, page, sort }, { dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  return repository.liveStream
    .get({ filter, page, sort })
    .then(({ total, collection }) => ({
      collection,
      pager: { ...pager, total },
    }));
};
