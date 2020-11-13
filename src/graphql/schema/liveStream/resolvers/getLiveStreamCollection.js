
module.exports = async (_, { filter, page, sort }, { user, dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  if (user) {
    filter.blackList = user.blackList;
  }

  return Promise.all([
    repository.liveStream.get({ filter, page, sort }),
    repository.liveStream.getTotal(filter),
  ])
    .then(([collection, total]) => ({
      collection,
      pager: { ...pager, total },
    }));
};
