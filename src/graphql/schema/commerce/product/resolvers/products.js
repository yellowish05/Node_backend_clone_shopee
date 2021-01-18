/* eslint-disable no-param-reassign */
const path = require('path');
const { Promise } = require('bluebird');

const ProductService = require(path.resolve('src/lib/ProductService'));
const axios = require('axios');
const jsonFile = 'http://www.floatrates.com/daily/usd.json';

// const currencyServiceUrl = 'https://api.exchangeratesapi.io/latest';
// const currencyServiceUrl = 'https://api.exchangerate.host/latest';
// const { Currency } = require('../../../../../lib/Enums');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (_, {
  filter, page, sort,
}, { user, dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };
    
  filter = await ProductService.composeProductFilter(filter, user);

  console.log('[filter] done');
  // if (sort.feature == 'PRICE') {
  //   const temppage = {
  //     limit: 0,
  //     skip: 0,
  //   };

  //   return Promise.all([
  //     repository.product.get({ filter, page: temppage, sort }),
  //     repository.product.getTotal(filter),
  //   ]).then(([allProducts, total]) => axios.get(jsonFile)
  //     .then(({ data }) => {
  //       const rates = {};
  //       Object.keys(data).some((key) => {
  //         rates[key.toUpperCase()] = data[key].rate;
  //       });
  //       rates.USD = 1;
  //       if (sort.type == 'ASC') { allProducts.sort((a, b) => a.price / rates[a.currency] - b.price / rates[b.currency]); } else { allProducts.sort((a, b) => b.price / rates[b.currency] - a.price / rates[a.currency]); }
  //       let collection;
  //       if (page.limit > 0) { collection = allProducts.slice(page.skip, page.skip + page.limit); } else { collection = allProducts.slice(page.skip); }
  //       return { collection, pager: { ...pager, total } };
  //     }));
  // }

  return Promise.all([
    repository.product.get({ filter, page, sort }),
    repository.product.getTotal(filter),
  ])
    .then(([collection, total]) => ({
      collection,
      pager: { ...pager, total },
    }))
    .catch(error => {
      throw errorHandler.build([error]);
    });
};
