/* eslint-disable no-this-before-super */
/* eslint-disable class-methods-use-this */

const { Currency } = require('../../Enums');
const AmountOfMoneyAbstract = require('./AmountOfMoneyAbstract');

function convertToCents(currencyAmount) {
  return currencyAmount ? Math.round(currencyAmount * 1000) : this.cents;
}

function convertToCurrency(centsAmount) {
  return (centsAmount || this.cents) / 1000;
}

class AmountOfINR extends AmountOfMoneyAbstract {
  constructor({ centsAmount, currencyAmount }) {
    let cents = null;
    if (centsAmount) {
      cents = centsAmount;
    } else if (currencyAmount) {
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
