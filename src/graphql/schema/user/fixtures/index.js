/* eslint-disable no-param-reassign */
const { gql } = require('apollo-server');
const path = require('path');

const logger = require(path.resolver('config/logger'));

const mutation = gql`
    mutation registerUser($email: String!, $password: String!) {
        addUser(data: {email: $email, password: $password}) {
            id
            email
        }
    }
`;

const userData = [
  { email: 'test1@domain.com', password: '123456' },
  { email: 'test2@domain.com', password: '123456' },
  { email: 'test3@domain.com', password: '123456' },
  { email: 'test4@domain.com', password: '123456' },
];

module.exports.data = {
  users: userData,
};

module.exports.handler = async (client, context, data) => {
  logger.info('[fixture] User execution!');
  context.users = {};
  return Promise.all(userData.map((variables) => (
    client
      .mutate({ mutation, variables })
      .then(({ data: { addUser: { id, email } } }) => {
        context.users[email] = { id };
      })
  )));
};
