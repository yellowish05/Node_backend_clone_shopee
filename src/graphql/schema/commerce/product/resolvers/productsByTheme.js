const path = require('path');

const ProductService = require(path.resolve('src/lib/ProductService'));

module.exports = (_, { filter, page, sort }, { dataSources: { repository }, user }) => {
  return null;
};
