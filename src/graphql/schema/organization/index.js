const { gql } = require('apollo-server');

const updateOrganization = require('./resolvers/updateOrganization');

const schema = gql`
    # enum OrganizationType {
    #   privatePerson
    #   store
    # }

    type Organization {
      # id: ID!
      # owner: User
      # name: String
      # type: OrganizationType
      address: Address
      billingAddress: Address
      payoutInfo: String
      returnPolicy: String
    }

    input OrganizationInput {
      # name: String
      # type: OrganizationType
      address: AddressInput
      billingAddress: AddressInput
      payoutInfo: String
      returnPolicy: String
    }

    extend type Query {
      organization: Organization @auth(requires: USER)
    }

    extend type Mutation {
      updateOrganization(data: OrganizationInput): Organization! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    organization(_, args, { user, dataSources: { repository } }) {
      return repository.organization.getByUser(user);
    },
  },
  Mutation: {
    updateOrganization,
  },
};
