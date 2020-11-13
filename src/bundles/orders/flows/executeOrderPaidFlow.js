/* eslint-disable no-param-reassign */
const path = require('path');

const logger = require(path.resolve('config/logger'));
const repository = require(path.resolve('src/repository'));
const { PurchaseOrderStatus, OrderItemStatus } = require(path.resolve('src/lib/Enums'));

module.exports = async (purchaseOrder) => {
  purchaseOrder.isPaid = true;
  purchaseOrder.status = PurchaseOrderStatus.ORDERED;

  const orderItems = await repository.orderItem.getByIds(purchaseOrder.items);

  // Divide between sellers for make saleorders for each
  const itemsBySeller = orderItems.reduce((result, orderItem) => {
    const { seller } = orderItem;
    if (typeof result[seller] === 'undefined') {
      // eslint-disable-next-line no-param-reassign
      result[seller] = [];
    }
    result[seller].push(orderItem);
    return result;
  }, {});

  const saleOrderPromisses = Object.keys(itemsBySeller).map((seller) => {
    const saleOrder = {
      seller,
      buyer: purchaseOrder.buyer,
      deliveryOrders: purchaseOrder.deliveryOrders,
      items: itemsBySeller[seller].map((item) => item.id),
      quantity: itemsBySeller[seller].reduce((sum, item) => sum + item.quantity, 0),
      currency: purchaseOrder.currency,
      total: itemsBySeller[seller].reduce((sum, item) => sum + item.total, 0),
    };

    return repository.saleOrder.create(saleOrder);
  });


  await Promise.all([
    purchaseOrder.save(),
    repository.orderItem.changeStatus(purchaseOrder.items, OrderItemStatus.ORDERED),
    ...saleOrderPromisses,
  ])
    .then(([, , ...orders]) => {
      const saleOrderIds = orders.map((order) => order.id);
      logger.info(`[PURCHASE_ORDER_PAID_FLOW][${purchaseOrder.id}] success! SaleOrders "${saleOrderIds.join(', ')}" Created`);
    })
    .catch((error) => {
      logger.error(`[PURCHASE_ORDER_PAID_FLOW][${purchaseOrder.id}] failed! error "${error.message}" ${error.stack}`);
    });
};
