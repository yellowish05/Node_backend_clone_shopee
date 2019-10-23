const { gql } = require('apollo-server');

const addOrganization = require('./resolvers/addOrganization');
const updateOrganization = require('./resolvers/updateOrganization');

const schema = gql`
    enum OrganizationType {
      privatePerson
      store
    }

    enum OrganizationSellingTo {
      domestic
      international
    }

    type Organization {
      id: ID!
      owner: User
      name: String
      type: OrganizationType
      address: Address
      billingAddress: Address
      payoutInfo: String
      sellingTo: OrganizationSellingTo
      domesticShippingCourier: ShoppingCourier
      internationalShippingCourier: ShoppingCourier
      returnPolicy: String
    }

    input OrganizationInput {
      name: String
      type: OrganizationType
      address: AddressInput
      billingAddress: AddressInput
      payoutInfo: String
      sellingTo: OrganizationSellingTo
      domesticShippingCourierId: ID
      internationalShippingCourierId: ID
      returnPolicy: String
    }

    extend type Query {
      organizations: [Organization] @auth(requires: USER)
      organization(id: ID!): Organization @auth(requires: USER)
    }

    extend type Mutation {
      addOrganization(data: OrganizationInput): Organization! @auth(requires: USER)
      updateOrganization(id: ID, data: OrganizationInput): Organization! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    organizations(_, args, { dataSources: { repository }, user }) {
      return repository.organization.getAll({ owner: user._id });
    },
    organization(_, { id }, { dataSources: { repository } }) {
      return repository.organization.getById(id);
    },
  },
  Mutation: {
    addOrganization,
    updateOrganization,
  },
};
