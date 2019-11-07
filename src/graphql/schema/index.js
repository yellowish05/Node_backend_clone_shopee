const { makeExecutableSchema, mergeSchemas } = require('graphql-tools');
const { merge } = require('lodash');

const { typeDefs: commonTypeDefs, resolvers: commonResolvers } = require('./common');
const { typeDefs: authTypeDefs, auth } = require('./common/authDirective');
const { typeDefs: i18nTypeDefs, resolvers: i18nResolvers } = require('./common/i18n');
const { typeDefs: addressTypeDefs, resolvers: addressResolvers } = require('./common/address');
const { typeDefs: latLngTypeDefs, resolvers: latLngResolvers } = require('./common/latLng');
const { typeDefs: dateTypeDefs, resolvers: dateResolvers } = require('./common/date');
const { typeDefs: pagerTypeDefs } = require('./common/pager');
const { typeDefs: sortTypeDefs } = require('./common/sort');

const { typeDefs: userTypeDefs, resolvers: userResolvers } = require('./user');
const { typeDefs: accessTokenTypeDefs, resolvers: accessTokenResolvers } = require('./accessToken');
const { typeDefs: liveStreamTokenTypeDefs, resolvers: liveStreamResolvers } = require('./liveStream');
const { typeDefs: scTypeDefs, resolvers: scResolvers } = require('./shippingCourier');
const { typeDefs: countryTypeDefs, resolvers: countryResolvers } = require('./country');
const { typeDefs: regionTypeDefs, resolvers: regionResolvers } = require('./region');
const { typeDefs: organizationTypeDefs, resolvers: organizationResolvers } = require('./organization');
const { typeDefs: assetTypeDefs, resolvers: assetResolvers } = require('./asset');
const { typeDefs: streamChannelTypeDefs, resolvers: streamChannelResolvers } = require('./streamChannel');
const { typeDefs: messageTypeDefs, resolvers: messageResolvers } = require('./message');

const typeDefs = [].concat(
  commonTypeDefs,
  authTypeDefs,
  i18nTypeDefs,
  userTypeDefs,
  accessTokenTypeDefs,
  liveStreamTokenTypeDefs,
  scTypeDefs,
  countryTypeDefs,
  regionTypeDefs,
  addressTypeDefs,
  latLngTypeDefs,
  dateTypeDefs,
  pagerTypeDefs,
  sortTypeDefs,
  organizationTypeDefs,
  assetTypeDefs,
  streamChannelTypeDefs,
  messageTypeDefs,
);

const resolvers = merge(
  commonResolvers,
  userResolvers,
  i18nResolvers,
  accessTokenResolvers,
  liveStreamResolvers,
  scResolvers,
  countryResolvers,
  regionResolvers,
  addressResolvers,
  latLngResolvers,
  dateResolvers,
  organizationResolvers,
  assetResolvers,
  streamChannelResolvers,
  messageResolvers,
);

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives: {
    auth,
  },
});

module.exports = () => mergeSchemas({
  schemas: [
    schema,
  ],
});
