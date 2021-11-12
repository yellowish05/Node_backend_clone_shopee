const AmountOfWeightAbstract = require('../AmountOfWeightAbstract');
const { WeightUnitSystem } = require('../../Enums');

class AmountOfPOUND extends AmountOfWeightAbstract {
  constructor(amount) {
    super(amount);
  }

  getUnit() {
    return WeightUnitSystem.POUND;
  }

  getFormatted() {
    return `${Number(this.getWeightAmount()).toFixed(2)} ${this.getSymbol()}`;
  }

  getSymbol() {
    return 'lb';
  }

  toKG() {
    return this.weight * 0.453592;
  }
}

module.exports = AmountOfPOUND;
