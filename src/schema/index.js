const { merge } = require('lodash');

const { typeDefs: commonTypeDefs, resolvers: commonResolvers } = require('./common');
const { typeDefs: addressTypeDefs, resolvers: addressResolvers } = require('./common/address');

const { typeDefs: userTypeDefs, resolvers: userResolvers } = require('./user');
const { typeDefs: scTypeDefs, resolvers: scResolvers } = require('./shippingCourier');
const { typeDefs: countryTypeDefs, resolvers: countryResolvers } = require('./country');
const { typeDefs: regionTypeDefs, resolvers: regionResolvers } = require('./region');
const { typeDefs: organizationTypeDefs, resolvers: organizationResolvers } = require('./organization');

const typeDefs = [].concat(
  commonTypeDefs,
  userTypeDefs,
  scTypeDefs,
  countryTypeDefs,
  regionTypeDefs,
  addressTypeDefs,
  organizationTypeDefs,
);

const resolvers = merge(
  commonResolvers,
  userResolvers,
  scResolvers,
  countryResolvers,
  regionResolvers,
  addressResolvers,
  organizationResolvers,
);

module.exports = {
  typeDefs, resolvers,
};
