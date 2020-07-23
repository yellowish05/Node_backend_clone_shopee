const NodeCache = require('node-cache');
const axios = require('axios');
const querystring = require('querystring');
const path = require('path');
const { Currency } = require('./Enums');
const { CurrencyFactory } = require('./CurrencyFactory');

const logger = require(path.resolve('config/logger'));
const { exchangeCurrencyRates } = require(path.resolve('config'));
const cache = new NodeCache();
// const currencyServiceUrl = 'https://api.exchangeratesapi.io/latest';
const currencyServiceUrl = 'https://api.exchangerate.host/latest';

function UpdateRate() {
  const parameters = {
    base: Currency.USD,
    symbols: Currency.toList().toString(),
  };

  console.log(`${currencyServiceUrl}/?${querystring.stringify(parameters)}`);
  axios.get(`${currencyServiceUrl}/?${querystring.stringify(parameters)}`)
    .then(({ data }) => {
      const { rates } = data;
      const oldRates = cache.get('CURRENCY_RATES');
      if (oldRates && Object.keys(rates).some((key) => Math.abs(rates[key] - oldRates[key]) / rates[key] > 0.1)) {
        // Rates are too different
        logger.error('New Rates rates are too different:');
        logger.error(`Old Rates: ${JSON.stringify(oldRates)}`);
        logger.error(`New Rates: ${JSON.stringify(rates)}`);
        return 0;
      }

      if (oldRates && !Object.keys(rates).some((key) => rates[key] !== oldRates[key])) {
        // Rates are the same
        return 0;
      }

      logger.info(`New Rates added to cache: ${JSON.stringify(rates)}`);
      return cache.set('CURRENCY_RATES', rates);
    })
    .catch((error) => {
      logger.error(`Error happend while updating Currency Cache. Original error: ${error.message}`);
    });
}

UpdateRate();
setInterval(UpdateRate, exchangeCurrencyRates.TTL);

module.exports.CurrencyService = {
  exchange(amount, to) {
    if (typeof amount === 'undefined') {
      throw new Error('CurrencyService.exchange expected "amount" parameter');
    }
    if (typeof Currency[to] === 'undefined') {
      throw new Error('CurrencyService.exchange expected "to" parameter');
    }

    const cached = cache.get('CURRENCY_RATES');
    if (cached && cached[amount.getCurrency()] && cached[to]) {
      return Promise.resolve(CurrencyFactory.getAmountOfMoney({
        currencyAmount: amount.getCurrencyAmount() / cached[amount.getCurrency()] * cached[to],
        currency: to,
      }));
    }

    const parameters = {
      base: amount.getCurrency(),
      symbols: `${amount.getCurrency()},${to}`,
    };

    logger.warn(`Currency for ${amount.getCurrency()} and ${to} was not found in cache.`);

    return axios.get(`${currencyServiceUrl}/?${querystring.stringify(parameters)}`)
      .then(({ data }) => {
        const { rates } = data;
        logger.warn(`Got currency from API - ${JSON.stringify(rates)}`);
        return CurrencyFactory.getAmountOfMoney({
          currencyAmount: amount.getCurrencyAmount() / rates[amount.getCurrency()] * rates[to],
          currency: to,
        });
      })
      .catch((error) => {
        throw new Error(error);
      });
  },
};
