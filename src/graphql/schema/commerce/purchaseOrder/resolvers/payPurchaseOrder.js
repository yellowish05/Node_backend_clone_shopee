const { UserInputError, ForbiddenError } = require('apollo-server');
const checkout = require('../checkoutMethods');


module.exports = async function payPurchaseOrder(
  _,
  {
    id,
  },
  { dataSources: { repository }, user },
) {
  // creating order
  const order = await repository.purchaseOrder.getById(id);

  if (!order) {
    throw new UserInputError(`Order "${id}" does not exist`, { invalidArgs: ['id'] });
  }

  if (order.isPaid) {
    throw new UserInputError(`Order "${id}" is already paid`, { invalidArgs: ['id'] });
  }

  if (order.buyer !== user.id) {
    throw new ForbiddenError('You can not purchase this order');
  }

  // generate payments with Payment Provider data and update order
  const [transaction] = await checkout.generatePaymentsForOrder(order, repository);

  return transaction;
};
