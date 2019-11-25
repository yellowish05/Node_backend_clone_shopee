/* eslint-disable class-methods-use-this */
class AmountOfMoneyAbstract {
  constructor(cents) {
    if (cents == null || typeof cents === 'undefined') {
      throw new Error(`AmountOf${this.getCurrency()} can be created only with amount!`);
    }
    this.cents = cents;
  }

  convertToCents(currencyAmount) {
    throw new Error('Not implemented');
  }

  convertToCurrency(centsAmount) {
    throw new Error('Not implemented');
  }

  getCurrency() {
    throw new Error('Not implemented');
  }

  getFormatted() {
    throw new Error('Not implemented');
  }
}

module.exports = AmountOfMoneyAbstract;
