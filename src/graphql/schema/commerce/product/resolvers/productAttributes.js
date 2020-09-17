/* eslint-disable no-param-reassign */
const path = require('path');
const { Promise } = require('bluebird');

const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const axios = require('axios');
const querystring = require('querystring');

// const currencyServiceUrl = 'https://api.exchangerate.host/latest';
const currencyServiceUrl = 'https://api.exchangeratesapi.io/latest';
const { Currency } = require('../../../../../lib/Enums');

const parameters = {
  base: Currency.USD,
  // symbols: Currency.toList().toString(),
  symbols: Currency,
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

module.exports = async (_, { productId }, { dataSources: { repository } }) => {
    return Promise.all([
        repository.product.getById({ _id: productId }),
    ])
    .then(([product]) => axios.get(`${currencyServiceUrl}/?${querystring.stringify(parameters)}`)
    .then(async ({ data }) => {
        var attributes = [];
        if (product.attrs != null && product.attrs.length > 0) {
            attributes = await repository.productAttributes.getByIds(product.attrs);
            await Promise.all(attributes.map(async (attr, index) => {
                attributes[index].asset = await repository.asset.getById(attr.asset);
            }));
        }
        return attributes;
    }));
};
