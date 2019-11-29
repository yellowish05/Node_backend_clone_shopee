const { makeExecutableSchema, mergeSchemas } = require('graphql-tools');
const { merge } = require('lodash');

const { typeDefs: commonTypeDefs, resolvers: commonResolvers } = require('./common');
const { typeDefs: testErrorsTypeDefs, resolvers: testErrorsResolvers } = require('./common/testErrors');
const { typeDefs: authTypeDefs, auth } = require('./common/authDirective');
const { typeDefs: i18nTypeDefs, resolvers: i18nResolvers } = require('./common/i18n');
const { typeDefs: addressTypeDefs, resolvers: addressResolvers } = require('./common/address');
const { typeDefs: latLngTypeDefs, resolvers: latLngResolvers } = require('./common/latLng');
const { typeDefs: dateTypeDefs, resolvers: dateResolvers } = require('./common/date');
const { typeDefs: pagerTypeDefs } = require('./common/pager');
const { typeDefs: sortTypeDefs } = require('./common/sort');

const { typeDefs: userTypeDefs, resolvers: userResolvers } = require('./user');
const { typeDefs: userSettingsTypeDefs, resolvers: userSettingsResolvers } = require('./userSettings');
const { typeDefs: accessTokenTypeDefs, resolvers: accessTokenResolvers } = require('./accessToken');
const { typeDefs: liveStreamTokenTypeDefs, resolvers: liveStreamResolvers } = require('./liveStream');
const { typeDefs: sbTypeDefs, resolvers: sbResolvers } = require('./shippingBox');
const { typeDefs: countryTypeDefs, resolvers: countryResolvers } = require('./country');
const { typeDefs: regionTypeDefs, resolvers: regionResolvers } = require('./region');
const { typeDefs: organizationTypeDefs, resolvers: organizationResolvers } = require('./organization');
const { typeDefs: cityTypeDefs, resolvers: cityResolvers } = require('./city');
const { typeDefs: verificationCodeTypeDefs, resolvers: verificationCodeResolvers } = require('./verificationCode');
const { typeDefs: assetTypeDefs, resolvers: assetResolvers } = require('./asset');
const { typeDefs: streamChannelTypeDefs, resolvers: streamChannelResolvers } = require('./streamChannel');
const { typeDefs: messageTypeDefs, resolvers: messageResolvers } = require('./message');
const { typeDefs: notificationTypeDefs, resolvers: notificationResolvers } = require('./notification');
const { typeDefs: notificationDataTypeDefs, resolvers: notificationDataResolvers } = require('./notification/notificationTypes');

const { typeDefs: commerceTypeDefs, resolvers: commerceResolvers } = require('./commerce');
const { typeDefs: paymentTypeDefs, resolvers: paymentResolvers } = require('./payment');

const typeDefs = [].concat(
  commonTypeDefs,
  testErrorsTypeDefs,
  authTypeDefs,
  i18nTypeDefs,
  userTypeDefs,
  userSettingsTypeDefs,
  accessTokenTypeDefs,
  liveStreamTokenTypeDefs,
  sbTypeDefs,
  countryTypeDefs,
  regionTypeDefs,
  addressTypeDefs,
  latLngTypeDefs,
  dateTypeDefs,
  pagerTypeDefs,
  sortTypeDefs,
  organizationTypeDefs,
  cityTypeDefs,
  verificationCodeTypeDefs,
  assetTypeDefs,
  streamChannelTypeDefs,
  messageTypeDefs,
  commerceTypeDefs,
  notificationDataTypeDefs,
  notificationTypeDefs,
  paymentTypeDefs,
);

const resolvers = merge(
  commonResolvers,
  testErrorsResolvers,
  userResolvers,
  userSettingsResolvers,
  i18nResolvers,
  accessTokenResolvers,
  liveStreamResolvers,
  sbResolvers,
  countryResolvers,
  regionResolvers,
  addressResolvers,
  latLngResolvers,
  dateResolvers,
  organizationResolvers,
  cityResolvers,
  verificationCodeResolvers,
  assetResolvers,
  streamChannelResolvers,
  messageResolvers,
  commerceResolvers,
  notificationDataResolvers,
  notificationResolvers,
  paymentResolvers,
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
