/* eslint-disable no-this-before-super */
/* eslint-disable class-methods-use-this */

const { Currency } = require('../../Enums');
const AmountOfMoneyAbstract = require('./AmountOfMoneyAbstract');

function convertToCents(currencyAmount) {
  return currencyAmount ? Math.round(currencyAmount * 100) : this.cents;
}

function convertToCurrency(centsAmount) {
  return (centsAmount || this.cents) / 100;
}

class AmountOfGBP extends AmountOfMoneyAbstract {
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
    return `£ ${Number(this.getCurrencyAmount()).toFixed(2)}`;
  }
}

module.exports = AmountOfGBP;
