const path = require('path');

const header = require(path.resolve('src/view/header.email'));
const layout = require(path.resolve('src/view/simple.layout.email'));
const footer = require(path.resolve('src/view/footer.email'));

module.exports = {
  subject: 'Confirm email',
  build({ code, ...args }) {
    return () => {
      return layout(`Confirm email`, args);
    };
  },
};
