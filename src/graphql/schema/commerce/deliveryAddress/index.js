const { gql } = require('apollo-server');

const addDeliveryAddress = require('./resolvers/addDeliveryAddress');
const deleteDeliveryAddress = require('./resolvers/deleteDeliveryAddress');

const schema = gql`
    type DeliveryAddress implements AddressInterface {
        id: ID!
        label: String
        street: String
        city: String
        region: Region
        country: Country!
        zipCode: String
        isDeliveryAvailable: Boolean!
        addressId: String
    }

    input DeliveryAddressInput {
        label: String
        street: String
        city: String
        region: ID!
        country: ID!
        zipCode: String
    }

    extend type Query {
        """
            Allows: authorized user
        """
        deliveryAddresses: [DeliveryAddress]! @auth(requires: USER)
    }

    extend type Mutation {
        """
            Allows: authorized user
        """
        addDeliveryAddress(data: DeliveryAddressInput!) : DeliveryAddress! @auth(requires: USER)
        """
            Allows: authorized user
        """
        deleteDeliveryAddress(id: ID!) : Boolean! @auth(requires: USER)
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    deliveryAddresses: async (_, args, { dataSources: { repository }, user }) => repository.deliveryAddress.getAll({ owner: user.id }),
  },
  Mutation: {
    addDeliveryAddress,
    deleteDeliveryAddress,
  },
  DeliveryAddress: {
    addressId: async ({ address: { addressId } }) => addressId,
    street: async ({ address: { street } }) => street,
    city: async ({ address: { city } }) => city,
    region: async ({ address: { region } }, _, { dataSources: { repository } }) => repository.region.getById(region),
    country: async ({ address: { country } }, _, { dataSources: { repository } }) => repository.country.getById(country),
    zipCode: async ({ address: { zipCode } }) => zipCode,
    isDeliveryAvailable: async ({ address: { isDeliveryAvailable } }) => isDeliveryAvailable,
  },
};
