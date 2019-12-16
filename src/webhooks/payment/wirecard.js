const path = require('path');

const logger = require(path.resolve('config/logger'));
const provider = require(path.resolve('src/bundles/payment/providers/WireCard'));
const { TransactionAlreadyProcessedException } = require(path.resolve('src/bundles/payment/Exceptions'));
const repository = require(path.resolve('src/repository'));
const { PurchaseOrderStatus, OrderItemStatus } = require(path.resolve('src/lib/Enums'));
const pubsub = require(path.resolve('config/pubsub'));

module.exports = async (req, res) => {
  const { body, headers } = req;

  logger.debug(JSON.stringify(headers));
  logger.debug(JSON.stringify(body));

  const response = provider.createTransactionResponse(body);

  if (!response.isValid()) {
    return res.status(403).send('FORBIDDEN');
  }

  try {
    const transaction = await provider.processTransaction(response);
    pubsub.publish('PAYMENT_TRANSACTION_CHANGED', transaction);
    res.status(200).send('success');

    // Need chnage status of order and create SaleOrder.
    // TODO: Trigger here event and move code in right place
    const purchaseOrder = await repository.purchaseOrder.findByTransactionId(transaction.id);
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
      .then(([savedPurchaseOrder, _, ...orders]) => {
        const saleOrderIds = orders.map((order) => order.id);
        logger.debug(`[PAYMENT][WIRECARD][WEBHOOK] Payment Transaction ID "${transaction.id}" processed! SaleOrders "${saleOrderIds.join(', ')}" Created`);
      })
      .catch((error) => {
        logger.error(`[PAYMENT][WIRECARD][WEBHOOK] Payment Transaction ID "${transaction.id}" failed! error "${error.message}" ${error.stack}`);
      });
  } catch (error) {
    if (error instanceof TransactionAlreadyProcessedException) {
      logger.warn(`[PAYMENT][WIRECARD][WEBHOOK][${error.name}] "${error.message}"`);
      return res.status(200).send('Transaction already processed');
    }

    logger.error(`[PAYMENT][WIRECARD][WEBHOOK][${error.name}] "${error.message}" ${error.stack}`);
    return res.status(500).send('Internal Server Error');
  }
};
