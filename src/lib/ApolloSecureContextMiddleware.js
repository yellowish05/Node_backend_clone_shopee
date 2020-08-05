const jwt = require('jsonwebtoken');
const { AuthenticationError } = require('apollo-server');
const JWT_REGEX = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

const path = require('path');
const serviceAccount = require(path.resolve('config/adminSDK.json'));
const axios = require('axios');
const logger = require('../../config/logger');

function fetchAuthorization({ req, connection }) {
  if (connection) {
    return connection.context.Authorization || null;
  }
  return req.headers && (req.headers.authorization || null);
}

function fetchJWT(authorization) {
  if (authorization.indexOf('Bearer') !== 0) {
    return null;
  }

  const token = authorization.substr(7);
  if (!JWT_REGEX.test(token)) {
    return null;
  }

  return token;
}

module.exports = (repository) => async (request) => {
  const authorization = fetchAuthorization(request);
  if (!authorization) {
    return {};
  }

  const token = fetchJWT(authorization);
  if (!token) {
    return {};
  }

  const data = jwt.decode(token);
  if (!data) {
    return {};
  }
  // if (!data.uid || !data.user_id || !data.exp) {
  //   return {};
  // }
  if (!data.uid || !data.exp) {
    return {};
  }

  const accessToken = await repository.accessToken.load(data.uid);

  await axios.get(serviceAccount.client_x509_cert_url)
  .then((response) => {
    const public_key = response.data[serviceAccount.private_key_id];
    try {
      jwt.verify(token, public_key, { algorithms: "RS256" });
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  })
  .catch((err) => {
    logger.error(err);
    throw new AuthenticationError('User Authentication Failed');
  });

  const user = await repository.user.load(accessToken.user);
  return { user };
};
