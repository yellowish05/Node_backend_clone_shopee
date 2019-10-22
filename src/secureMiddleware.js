const jwt = require('express-jwt');
const { AuthenticationError } = require('apollo-server');


module.exports = ({ repository }) => jwt({
  // eslint-disable-next-line consistent-return
  secret: (req, payload, done) => {
    if (payload === undefined) {
      return done(new AuthenticationError('Missing secret'));
    }

    repository.accessToken.load(payload.id).then((res) => {
      if (res === null || res.secret === null) {
        return done(new AuthenticationError('Invalid token'));
      }

      return done(null, res.secret);
    });
  },
  credentialsRequired: false,
});
