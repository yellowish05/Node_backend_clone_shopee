const { gql } = require('apollo-server');

const schema = gql`
    input AddressInput {
        label: String
        street: String
        city: String
        region: ID!
        country: ID!
        zipCode: String
    }

    interface AddressInterface {
        street: String
        city: String
        region: Region
        country: Country!
        zipCode: String
    }

    type Address implements AddressInterface {
        street: String
        city: String
        region: Region
        country: Country!
        zipCode: String
    }

    type DeliveryAddress implements AddressInterface {
        label: String
        street: String
        city: String
        region: Region
        country: Country!
        zipCode: String
        isDeliveryAvailable: Boolean!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {};
