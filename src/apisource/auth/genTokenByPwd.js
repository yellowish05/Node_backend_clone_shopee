const gql = require('graphql-tag');
const logger = require('../../../config/logger');

const MUTATION = gql`
  mutation genTokenByPwd($email: String!, $password: String!, $ip: String, $userAgent: String) {
    auth {
      genTokenByPwd(input:{
        email: $email,
        password: $password,
        ip: $ip,
        userAgent: $userAgent
      })
    }
  }
`

module.exports = (client) => async (vars) => {
  return client.mutate({
    mutation: MUTATION,
    variables: vars,
  })
    .then(({ data: { auth: { genTokenByPwd } } }) => {
      return genTokenByPwd;
    })
    .catch((error) => {
      logger.error(error.message);
      logger.error(error.stack)
    });
};
