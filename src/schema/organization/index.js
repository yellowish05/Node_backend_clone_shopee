const { gql } = require('apollo-server');

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
      ownerId: ID
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
      organizations: [Organization]
      organization(id: ID!): Organization
    }

    extend type Mutation {
      addOrganization(data: OrganizationInput): Organization!
      updateOrganization(id: ID, data: OrganizationInput): Organization!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {

  },
};
