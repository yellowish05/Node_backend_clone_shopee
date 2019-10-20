const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const uuid = require('uuid/v4');

class AccessTokenRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ id });
  }

  async create(user, data = {}) {
    const token = new this.model({
      id: uuid(),
      user: user._id,
      ip: data.ip || null,
      secret: bcrypt.genSaltSync(64),
    });

    if (data.userAgent) {
      token.fingerprint = data.userAgent.replace(/\s/g, '').toLowerCase();
    }

    return token.save()
      .then(() => jsonwebtoken.sign({
        id: token.id,
        user_id: user.id,
      }, token.secret, { expiresIn: data.expiresIn || '1w' }));
  }
}

module.exports = AccessTokenRepository;
