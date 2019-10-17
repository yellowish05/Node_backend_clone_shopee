const { gql } = require('apollo-server');

const schema = gql`
    input AddressInput {
        label: String
        street: String
        city: String
        regionId: ID
        countryId: ID
        zipCode: String
    }

    type Address {
        label: String
        street: String
        city: String
        region: Region
        country: Country
        zipCode: String
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {};
