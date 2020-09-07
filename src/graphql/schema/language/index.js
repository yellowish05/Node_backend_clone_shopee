const { gql } = require('apollo-server');
const path = require('path');
const { LanguageList } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    enum LanguageList {
        ${LanguageList.toGQL()}
    }

    type LanguageDetails {
        id: LanguageList!
        name: String!
    }

    extend type Query {
        languages: [LanguageDetails]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    languages(_, args, { dataSources: { repository } }) {
      return repository.language.getAll();                                
    },
  },
};
