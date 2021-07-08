const path = require('path');

const UnFulfilledStatuses = [ "CREATED", "ORDERED" ];
const DispatchedStatuses = [ "CARRIER_RECEIVED", "DELIVERED", "COMPLETE" ];

module.exports = async (_, { filter = {}, sort = {}, page }, { dataSources: { repository }, user}) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  filter.buyer = user.id;

  return Promise.all([
    repository.purchaseOrder.get(filter, sort, page),
    repository.purchaseOrder.getTotal(filter),
  ])
    .then(([collection, total]) => {
      collection.map(item=>{
        return item.deliveryOrders.map(deliveryOrder=>{
          deliveryOrder=repository.deliveryOrder.getById(deliveryOrder)
        })
      })
      return {
        collection,
        pager: { ...pager, total },
      };
    })
}

