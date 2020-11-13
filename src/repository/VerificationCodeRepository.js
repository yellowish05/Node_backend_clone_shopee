const uuid = require('uuid/v4');

class VerificationCodeRepository {
  constructor(model) {
    this.model = model;
    this.candidates = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    this.codeLength = 6;
  }

  async create({ user }) {
    if (!user) {
      throw Error('User is required!');
    }
    let code = '';
    for (let i = 0; i < this.codeLength; i += 1) {
      code += this.candidates.charAt(Math.floor(Math.random() * this.candidates.length));
    }

    const verificationCode = new this.model({
      user,
      code,
      _id: uuid(),
    });

    return verificationCode.save();
  }

  async deactivate(id) {
    if (!id) {
      throw Error('User id for deactivate codes is required!');
    }
    return this.model.updateMany({ user: id, isActive: true }, { isActive: false });
  }

  async getByCodeAndUser(code, user) {
    if (!user && !code) {
      throw Error('User id and verifiction code is required!');
    }
    return this.model.findOne({ user, code, isActive: true });
  }
}

module.exports = VerificationCodeRepository;
