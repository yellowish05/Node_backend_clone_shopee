class AmountOfWeightAbstract {
  constructor(weight) {
    if (typeof weight !== 'number') {
      throw new Error(`AmountOf${this.getUnit()} can be created only with amount!`);
    }
    this.weight = weight;
  }

  getWeightAmount() {
    return this.weight;
  }

  getUnit() {
    throw new Error('Not implemented');
  }

  getFormatted() {
    throw new Error('Not implemented');
  }

  getSymbol() {
    throw new Error('Not implemented');
  }

  toKG() {
    throw new Error('Not implemented');
  }
}

module.exports = AmountOfWeightAbstract;
