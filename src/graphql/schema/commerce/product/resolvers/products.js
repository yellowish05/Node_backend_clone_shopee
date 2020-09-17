/* eslint-disable no-param-reassign */
const path = require('path');
const { Promise } = require('bluebird');

const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const axios = require('axios');
const querystring = require('querystring');

const currencyServiceUrl = 'https://api.exchangeratesapi.io/latest';
// const currencyServiceUrl = 'https://api.exchangerate.host/latest';

const { Currency } = require('../../../../../lib/Enums');

const parameters = {
  base: Currency.USD,
  symbols: Currency,
  // symbols: Currency.toList().toString(),
};

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

  if(filter.categories) {
    const categories = [...filter.categories];
    await Promise.all(categories.map(async (category) => {
      await repository.productCategory.getByParent(category)
      .then((subcategories) => {
        if(subcategories.length > 0) {
          subcategories.map((item) => {
            filter.categories.push(item.id);
          })
        }
      });
    }));
  }

  if (filter.price) {
    if (filter.price.min) {
      filter.price.min = await exchangeOnSupportedCurrencies(filter.price.min);
    }

    if (filter.price.max) {
      filter.price.max = await exchangeOnSupportedCurrencies(filter.price.max);
    }
  }

  if (sort.feature == 'PRICE') {
    const temppage = {
      limit: 0,
      skip: 0,
    };

    return Promise.all([
      repository.product.get({ filter, page: temppage, sort }),
      repository.product.getTotal(filter),
    ]).then(([allProducts, total]) => axios.get(`${currencyServiceUrl}/?${querystring.stringify(parameters)}`)
      .then(({ data }) => {
        const { rates } = data;
        if (sort.type == 'ASC') { allProducts.sort((a, b) => a.price / rates[a.currency] - b.price / rates[b.currency]); } else { allProducts.sort((a, b) => b.price / rates[b.currency] - a.price / rates[a.currency]); }
        let collection;
        if (page.limit > 0) { collection = allProducts.slice(page.skip, page.skip + page.limit); } else { collection = allProducts.slice(page.skip); }
        return { collection, pager: { ...pager, total } };
      }));
  }

  return Promise.all([
    repository.product.get({ filter, page, sort }),
    repository.product.getTotal(filter),
  ])
    .then(([collection, total]) => ({
      collection,
      pager: { ...pager, total },
    }));
};
