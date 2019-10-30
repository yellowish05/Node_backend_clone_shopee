const uuid = require('uuid/v4');

class VerificationCodeRepository {
  constructor(model) {
    this.model = model;
    this.candidates = '123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    this.codeLength = 6;
  }

  async create(data) {
    if (!data.userId) {
      throw Error('User id is required!');
    }
    let code = '';
    for (let i = 0; i < this.codeLength; i++) {
      code += this.candidates.charAt(Math.floor(Math.random() * this.candidates.length));
    }

    const verificationCode = new this.model({
      ...data,
      code,
      _id: uuid(),
    });

    return verificationCode.save();
  }


  async deactivate(id) {
    if (!id) {
      throw Error('User id deactivateis is required!');
    }
    return this.model.updateMany({ userId: id, isActive: true }, { isActive: false });
  }

  async getByCodeAndUser(code, userId) {
    if (!userId && !code) {
      throw Error('User id and verifiction code is required!');
    }
    return this.model.findOne({ userId, code, isActive: true });
  }
}

module.exports = VerificationCodeRepository;
