
module.exports = async (_, { filter, page, sort }, { dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  return repository.liveStream
    .get({ filter, page, sort })
    .then((collection) => {
      if (collection.length < page.limit) {
        return {
          collection,
          pager: { ...pager, total: collection.length },
        };
      }

      return repository.liveStream
        .getTotal(filter)
        .then((total) => ({
          collection,
          pager: { ...pager, total },
        }));
    });
};
