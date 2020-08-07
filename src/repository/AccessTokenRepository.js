const bcrypt = require('bcryptjs');
const jsonwebtoken = require('jsonwebtoken');
const uuid = require('uuid/v4');

const path = require('path');
const admin = require("firebase-admin");
const serviceAccount = require(path.resolve('config/adminSDK.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://shoclef-171ab.firebaseio.com"
});

class AccessTokenRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async findByUserId(userID) {
    return this.model.findOne({ user: userID });
  }

  async findAllByUserId(userID) {
    return this.model.find({ user: userID });
  }

  async create(user, data = {}) {
    return this.findByUserId(user._id)
      .then((token) => {

        if (token) {
          this.findAllByUserId(user._id).then((tokens) => {
            tokens.forEach(item => {
              if (item._id !== token._id)
                item.remove();
            });
          });
          token.ip = data.ip || null;

          if (data.userAgent) {
            token.fingerprint = data.userAgent.replace(/\s/g, '').toLowerCase();
          }

          return token.save()
            .then(() => {
              return admin.auth().createCustomToken(token._id)
                .then((customToken) => {
                  return customToken;
                })
                .catch((error) => {
                  return error;
                });
            });
        } else {
          const newToken = new this.model({
            _id: uuid(),
            user: user._id,
            ip: data.ip || null,
            secret: bcrypt.genSaltSync(64),
          });

          if (data.userAgent) {
            newToken.fingerprint = data.userAgent.replace(/\s/g, '').toLowerCase();
          }

          return newToken.save()
            .then(() => {
              return admin.auth().createCustomToken(newToken._id);
            }).catch((error) => {
              return error
            });
        }
      });
  }
}

module.exports = AccessTokenRepository;
