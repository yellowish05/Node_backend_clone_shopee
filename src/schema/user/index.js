const { gql } = require('apollo-server');

const schema = gql`
    type User {
      id: ID!
      email: String
      name: String
    }

    extend type Query {
        me: User!
    }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    me: () => ({
      id: 45456,
      email: 'myfacetest@domain.com',
      name: 'Jouh Dou',
    }),
  },
};
