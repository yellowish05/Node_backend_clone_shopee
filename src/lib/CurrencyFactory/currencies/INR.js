/* eslint-disable no-this-before-super */
/* eslint-disable class-methods-use-this */

const { Currency } = require('../../Enums');
const AmountOfMoneyAbstract = require('./AmountOfMoneyAbstract');

function convertToCents(currencyAmount) {
  return Math.round(currencyAmount * 1000);
}

function convertToCurrency(centsAmount) {
  return centsAmount / 1000;
}

class AmountOfINR extends AmountOfMoneyAbstract {
  constructor({ centsAmount, currencyAmount }) {
    let cents = null;
    if (typeof centsAmount === 'number') {
      cents = centsAmount;
    } else if (typeof currencyAmount === 'number') {
      cents = convertToCents(currencyAmount);
    }
    super(cents);
  }

  getCentsAmount() {
    return this.cents;
  }

  getCurrencyAmount() {
    return convertToCurrency(this.cents);
  }

  getCurrency() {
    return Currency.GBP;
  }

  getFormatted() {
    return `₹ ${Number(this.getCurrencyAmount()).toFixed(3)}`;
  }
}

module.exports = AmountOfINR;
