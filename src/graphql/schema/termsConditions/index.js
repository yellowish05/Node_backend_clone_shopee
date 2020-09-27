const { gql } = require('apollo-server');
const path = require('path');
// const { LanguageList } = require(path.resolve('src/lib/Enums'));

const schema = gql`
    type TermsItem {
        id: ID!
        prefix: String!,
        englishTitle: String,
        title: String,
        html: String,
        language: LanguageList
    }

    extend type Query {
        termsandcoditions(language: LanguageList): [TermsItem]!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    termsandcoditions(_, args, { dataSources: { repository } }) {
      return repository.termsCondition.getByLanguage(args.language);                                
    },
  },
};
