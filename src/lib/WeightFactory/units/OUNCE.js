const AmountOfWeightAbstract = require('../AmountOfWeightAbstract');
const { WeightUnitSystem } = require('../../Enums');

class AmountOfOUNCE extends AmountOfWeightAbstract {
  constructor(amount) {
    super(amount);
  }

  getUnit() {
    return WeightUnitSystem.OUNCE;
  }

  getFormatted() {
    return `${Number(this.getWeightAmount()).toFixed(1)} ${this.getSymbol()}`;
  }

  getSymbol() {
    return 'oz';
  }

  toKG() {
    return this.weight * 0.0283495;
  }
}

module.exports = AmountOfOUNCE;
