const { gql } = require('apollo-server');
const { i18n: { locales } } = require('../../../../config');

const schema = gql`
    enum LOCALE {
      ${locales.join('\n')}
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {};
