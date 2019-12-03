/* eslint-disable no-param-reassign */
const path = require('path');

const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

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

  if (filter.price) {
    if (filter.price.min) {
      filter.price.min = await exchangeOnSupportedCurrencies(filter.price.min);
    }

    if (filter.price.max) {
      filter.price.max = await exchangeOnSupportedCurrencies(filter.price.max);
    }
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
