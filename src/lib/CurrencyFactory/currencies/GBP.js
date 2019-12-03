/* eslint-disable no-this-before-super */
/* eslint-disable class-methods-use-this */

const { Currency } = require('../../Enums');
const AmountOfMoneyAbstract = require('../AmountOfMoneyAbstract');

function convertToCents(currencyAmount) {
  return Math.round(currencyAmount * 100);
}

function convertToCurrency(centsAmount) {
  return centsAmount / 100;
}

class AmountOfGBP extends AmountOfMoneyAbstract {
  constructor({ centsAmount, currencyAmount }) {
    let cents = null;
    if (typeof centsAmount === 'number') {
      cents = centsAmount;
    } else if (typeof currencyAmount === 'number') {
      cents = convertToCents(currencyAmount);
    }
    super(cents);
  }

  getCurrencyAmount() {
    return convertToCurrency(this.cents);
  }

  getCurrency() {
    return Currency.GBP;
  }

  getFormatted() {
    return `£ ${Number(this.getCurrencyAmount()).toFixed(2)}`;
  }
}

module.exports = AmountOfGBP;
