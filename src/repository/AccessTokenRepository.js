const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const uuid = require('uuid/v4');

class AccessTokenRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async create(user, data = {}) {
    const token = new this.model({
      _id: uuid(),
      user: user._id,
      ip: data.ip || null,
      secret: bcrypt.genSaltSync(64),
    });

    if (data.userAgent) {
      token.fingerprint = data.userAgent.replace(/\s/g, '').toLowerCase();
    }

    return token.save()
      .then(() => jsonwebtoken.sign({
        id: token._id,
        user_id: user._id,
      }, token.secret, { expiresIn: data.expiresIn || '1w' }));
  }
}

module.exports = AccessTokenRepository;
