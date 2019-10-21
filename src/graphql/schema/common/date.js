const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const { gql } = require('apollo-server');

const schema = gql`
    scalar Date
    scalar DateNullable
`;


const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      return new Date(value);
    },
    serialize(value) {
      return value;
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10);
      }
      return null;
    },
  }),
  DateNullable: new GraphQLScalarType({
    name: 'DateNullable',
    description: 'Date custom scalar type allowing null values',
    parseValue(value) {
      return (value && new Date(value)) || null;
    },
    serialize(value) {
      return value || null;
    },
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10);
      }
      return null;
    },
  }),
};

module.exports.typeDefs = [schema];

module.exports.resolvers = resolvers;
