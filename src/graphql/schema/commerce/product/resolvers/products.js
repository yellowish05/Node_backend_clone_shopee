/* eslint-disable no-param-reassign */
const path = require('path');
const { Promise } = require('bluebird');

const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const axios = require('axios');

// const currencyServiceUrl = 'https://api.exchangeratesapi.io/latest';
// const currencyServiceUrl = 'https://api.exchangerate.host/latest';
const jsonFile = 'http://www.floatrates.com/daily/usd.json';
// const { Currency } = require('../../../../../lib/Enums');

// const parameters = {
//   base: Currency.USD,
//   symbols: Currency,
//   // symbols: Currency.toList().toString(),
// };

async function exchangeOnSupportedCurrencies(price) {
  const currencies = CurrencyFactory.getCurrencies();

  const exchangePromises = currencies.map(async (currency) => {
    const amountOfMoney = CurrencyFactory.getAmountOfMoney({
      currencyAmount: price.amount, currency: price.currency,
    });

    if (price.currency === currency) {
      return { amount: amountOfMoney.getCentsAmount(), currency };
    }

    return CurrencyService.exchange(amountOfMoney, currency)
      .then((money) => ({ amount: money.getCentsAmount(), currency }));
  });

  return Promise.all(exchangePromises);
}

async function productInLivestream(repository) {
  return repository.liveStream.getAll({"productDurations.0": {"$exists": true}})
    .then(livestreams => (livestreams.map(livestream => (livestream.productDurations.map(item => item.product)))))
    .then(arrays => [].concat(...arrays))
    .then(productIds => productIds.filter((v, i, a) => a.indexOf(v) === i))
}

module.exports = async (_, {
  filter, page, sort,
}, { user, dataSources: { repository } }) => {
  const pager = {
    limit: page.limit,
    skip: page.skip,
    total: 0,
  };

  if (user) {
    filter.blackList = user.blackList;
  }

  if (filter.categories) {
    await repository.productCategory.getUnderParents(filter.categories)
      .then(categories => {
        filter.categories = categories.map(item => item.id);
      })
  }

  if (filter.price) {
    if (filter.price.min) {
      filter.price.min = await exchangeOnSupportedCurrencies(filter.price.min);
    }

    if (filter.price.max) {
      filter.price.max = await exchangeOnSupportedCurrencies(filter.price.max);
    }
  }

  if (filter.hasLivestream) {
    const productIds = await productInLivestream(repository);
    filter.ids = productIds;
  }

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
    }));
};
