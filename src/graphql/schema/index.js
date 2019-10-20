const { makeExecutableSchema, mergeSchemas } = require('graphql-tools');
const { AuthInjection } = require('../../lib/AuthInjection');

const { typeDefs: commonTypeDefs, resolvers: commonResolvers } = require('./common');
const { typeDefs: addressTypeDefs, resolvers: addressResolvers } = require('./common/address');

const { typeDefs: userTypeDefs, resolvers: userResolvers } = require('./user');
const { typeDefs: authTypeDefs, resolvers: authResolvers } = require('./auth');
const { typeDefs: scTypeDefs, resolvers: scResolvers } = require('./shippingCourier');
const { typeDefs: countryTypeDefs, resolvers: countryResolvers } = require('./country');
const { typeDefs: regionTypeDefs, resolvers: regionResolvers } = require('./region');
const { typeDefs: organizationTypeDefs, resolvers: organizationResolvers } = require('./organization');

const typeDefs = [].concat(
  commonTypeDefs,
  userTypeDefs,
  authTypeDefs,
  scTypeDefs,
  countryTypeDefs,
  regionTypeDefs,
  addressTypeDefs,
  organizationTypeDefs,
);

const authInjection = new AuthInjection([
  commonResolvers,
  userResolvers,
  authResolvers,
  scResolvers,
  countryResolvers,
  regionResolvers,
  addressResolvers,
  organizationResolvers,
]);

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: authInjection.buildApolloResolvers(),
});

module.exports = () => mergeSchemas({
  schemas: [
    schema,
  ],
});
