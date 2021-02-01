const path = require('path');

const UnFulfilledStatuses = [ "CREATED", "ORDERED" ];
const DispatchedStatuses = [ "CARRIER_RECEIVED", "DELIVERED", "COMPLETE" ];

module.exports = async (_, { filter = {}, sort = {}, page }, { dataSources: { repository }, user}) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  return Promise.all([
    repository.purchaseOrder.get(filter, sort, page),
    repository.purchaseOrder.getTotal(filter),
  ])
    .then(([collection, total]) => {
      return {
        collection,
        pager: { ...pager, total },
      };
    })
}

