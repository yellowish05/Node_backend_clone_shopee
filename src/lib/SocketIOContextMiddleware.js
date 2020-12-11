const jwt = require('jsonwebtoken');
const JWT_REGEX = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;
const logger = require('../../config/logger');

function fetchAuthorization(socket) {
  return socket.request._query.token;
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

module.exports = (repository) => async (socket) => {
  const authorization = fetchAuthorization(socket);
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
  if (!data.id || !data.user_id || !data.exp) {
    return {};
  }

  const accessToken = await repository.accessToken.load(data.id);
  try {
    jwt.verify(token, accessToken.secret);
  } catch (error) {
    throw new Error('Invalid token');
  }

  const user = await repository.user.load(accessToken.user);
  return { user };
};
