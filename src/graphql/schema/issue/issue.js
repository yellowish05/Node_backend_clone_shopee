const path = require('path');
const { gql } = require('apollo-server');
const { IssueStatus } = require(path.resolve('src/lib/Enums'));

const addIssue = require('./resolvers/addIssue');
const deleteIssue = require('./resolvers/deleteIssue')
const updateIssue = require('./resolvers/updateIssue');

const schema = gql`
  enum IssueStatus {
    ${IssueStatus.toGQL()}
  }

  type Issue {
    issuer: User!
    email: String!
    message: String!
    category: IssueCategory!
    note: String
    status: IssueStatus!
  }

  input AddIssueInput {
    email: String!
    message: String!
    category: String!
  }

  input updateIssueInput {
    email: String
    message: String
    category: String
  }

  extend type Query {
    issue(id: ID!): Issue
  }

  extend type Mutation {
    addIssue(data: AddIssueInput!): Issue! @auth(requires: USER)
    updateIssue(id: ID!, data: updateIssueInput!): Issue! @auth(requires: USER)
    deleteIssue(id: ID!): Boolean @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    issue: async (_, { id }, { dataSources: { repository }}) => repository.issue.getById(id),
  },
  Mutation: {
    addIssue,
    deleteIssue,
    updateIssue,
  },
  Issue: {
    category: async ({ category }, _, { dataSources: { repository } }) => {
      return repository.issueCategory.getById(category);
    },
    issuer: async ({ issuer }, _, { dataSources: { repository } }) => {
      return repository.user.getById(issuer);
    },
  }
}
