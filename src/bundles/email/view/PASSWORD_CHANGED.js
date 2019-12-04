const path = require('path');

const layout = require(path.resolve('src/view/simple.layout.email'));

module.exports = {
  subject: 'Password has been changed',
  build({ code, ...args }) {
    return layout(`Password has been changed`, args);
  },
};
