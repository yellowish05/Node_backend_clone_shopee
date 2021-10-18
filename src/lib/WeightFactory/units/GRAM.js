const AmountOfWeightAbstract = require('../AmountOfWeightAbstract');
const { WeightUnitSystem } = require('../../Enums');

class AmountOfGRAM extends AmountOfWeightAbstract {
  constructor(amount) {
    super(amount);
  }

  getUnit() {
    return WeightUnitSystem.GRAM;
  }

  getFormatted() {
    return `${Number(this.getWeightAmount()).toFixed(0)} ${this.getSymbol()}`;
  }

  getSymbol() {
    return 'g';
  }

  toKG() {
    return this.weight * 0.001;
  }
}

module.exports = AmountOfGRAM;
