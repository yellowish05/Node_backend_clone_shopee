const gql = require('graphql-tag');
const logger = require('../../../config/logger');

const MUTATION = gql`
  mutation createIdentity($id: ID!, $email: String!, $password: String!) {
    auth {
      create(input: {
          userId: $id,
          email: $email,
          password: $password
      }) {
          id
          email
      }
    }
  }
`

module.exports = (client) => async ({ id, email, password }) => {
  return client.mutate({
    mutation: MUTATION,
    variables: {
      id,
      email,
      password,
    },
  })
    .then(({ data: {auth: {create}} }) => {
      return {id: create.id, email: create.email};
    })
    .catch((error) => {
      logger.error(error.message);
      logger.error(error.stack)
    });
};
