const { gql } = require('apollo-server');

const elasticSearch = require('./resolvers/elasticSearch');

const schema = gql`
    type Result {
        title: String!
        id: ID!
        assets: Asset
        type: String!
    }

    type ResultCollection {
        collection: [Result!]!
        pager: Pager
    }

    extend type Query {
        elasticSearch(
            category: String!
            searchKey: String!
            page: PageInput = {}
        ): ResultCollection!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
    Query: {
        elasticSearch
    },
    Result: {
        assets: async ({ assets }, _, { dataSources: { repository } }) => (
            repository.asset.load(assets)
        ),
    },
};