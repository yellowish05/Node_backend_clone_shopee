const { merge } = require('lodash');

const { typeDefs: commonTypeDefs, resolvers: commonResolvers } = require('./common');
const { typeDefs: carrierTypeDefs, resolvers: carrierResolvers } = require('./carrier');
const { typeDefs: brandTypeDefs, resolvers: brandResolvers } = require('./brand');
const { typeDefs: cartTypeDefs, resolvers: cartResolvers } = require('./cart');
const { typeDefs: productCategoryTypeDefs, resolvers: productCategoryResolvers } = require('./productCategory');
const { typeDefs: productTypeDefs, resolvers: productResolvers } = require('./product');
const { typeDefs: purchaseOrderTypeDefs, resolvers: purchaseOrderResolvers } = require('./purchaseOrder');
const { typeDefs: saleOrderTypeDefs, resolvers: saleOrderResolvers } = require('./saleOrder');
const { typeDefs: deliveryAddressTypeDefs, resolvers: deliveryAddressResolvers } = require('./deliveryAddress');
const { typeDefs: shippingOrderTypeDefs, resolvers: shippingOrderResolvers } = require('./deliveryOrder');
const { typeDefs: deliveryCalcTypeDefs, resolvers: deliveryCalcResolvers } = require('./deliveryCalculation');
const { typeDefs: payoutOrderTypeDefs, resolvers: payoutOrderResolvers } = require('./payoutOrder');
const { typeDefs: orderItemTypeDefs, resolvers: orderItemResolvers } = require('./orderItem');


const typeDefs = [].concat(
  brandTypeDefs,
  cartTypeDefs,
  productCategoryTypeDefs,
  productTypeDefs,
  commonTypeDefs,
  deliveryAddressTypeDefs,
  deliveryCalcTypeDefs,
  purchaseOrderTypeDefs,
  saleOrderTypeDefs,
  shippingOrderTypeDefs,
  payoutOrderTypeDefs,
  orderItemTypeDefs,
  carrierTypeDefs,
);

const resolvers = merge(
  brandResolvers,
  cartResolvers,
  productCategoryResolvers,
  productResolvers,
  commonResolvers,
  deliveryAddressResolvers,
  deliveryCalcResolvers,
  purchaseOrderResolvers,
  saleOrderResolvers,
  shippingOrderResolvers,
  payoutOrderResolvers,
  orderItemResolvers,
  carrierResolvers,
);

module.exports = {
  typeDefs,
  resolvers,
};
