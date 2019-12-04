const path = require('path');

const { verificationCode } = require(path.resolve('config'));
const layout = require(path.resolve('src/view/simple.layout.email'));

module.exports = {
  subject: 'Reset password',
  build({ code, ...args }) {
    return layout(`
        For recover password on Shoclef App use folowing verification code: ${code}
        This code expired in ${Math.floor(verificationCode.TTL / 60)} minutes.
        `, args);
  },
};
