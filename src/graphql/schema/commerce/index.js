const { merge } = require('lodash');

const { typeDefs: commonTypeDefs, resolvers: commonResolvers } = require('./common');
const { typeDefs: carrierTypeDefs, resolvers: carrierResolvers } = require('./carrier');
const { typeDefs: brandTypeDefs, resolvers: brandResolvers } = require('./brand');
const { typeDefs: cartTypeDefs, resolvers: cartResolvers } = require('./cart');
const { typeDefs: productCategoryTypeDefs, resolvers: productCategoryResolvers } = require('./productCategory');
const { typeDefs: productTypeDefs, resolvers: productResolvers } = require('./product');
const { typeDefs: purchaseOrderTypeDefs, resolvers: purchaseOrderResolvers } = require('./purchaseOrder');
const { typeDefs: shippingOrderTypeDefs, resolvers: shippingOrderResolvers } = require('./deliveryOrder');
const { typeDefs: paymentTransactionTypeDefs, resolvers: paymentTransactionResolvers } = require('./paymentTransaction');
const { typeDefs: payoutOrderTypeDefs, resolvers: payoutOrderResolvers } = require('./payoutOrder');
const { typeDefs: paymentMethodTypeDefs, resolvers: paymentMethodResolvers } = require('./paymentMethod');
const { typeDefs: orderItemTypeDefs, resolvers: orderItemResolvers } = require('./orderItem');


const typeDefs = [].concat(
  brandTypeDefs,
  cartTypeDefs,
  productCategoryTypeDefs,
  productTypeDefs,
  commonTypeDefs,
  purchaseOrderTypeDefs,
  shippingOrderTypeDefs,
  paymentTransactionTypeDefs,
  payoutOrderTypeDefs,
  paymentMethodTypeDefs,
  orderItemTypeDefs,
  carrierTypeDefs,
);

const resolvers = merge(
  brandResolvers,
  cartResolvers,
  productCategoryResolvers,
  productResolvers,
  commonResolvers,
  purchaseOrderResolvers,
  shippingOrderResolvers,
  paymentTransactionResolvers,
  payoutOrderResolvers,
  paymentMethodResolvers,
  orderItemResolvers,
  carrierResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
