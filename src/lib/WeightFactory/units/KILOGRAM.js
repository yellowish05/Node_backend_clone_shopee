const AmountOfWeightAbstract = require('../AmountOfWeightAbstract');
const { WeightUnitSystem } = require('../../Enums');

class AmountOfKILOGRAM extends AmountOfWeightAbstract {
  constructor(amount) {
    super(amount);
  }

  getUnit() {
    return WeightUnitSystem.KILOGRAM;
  }

  getFormatted() {
    return `${Number(this.getWeightAmount()).toFixed(3)} ${this.getSymbol()}`;
  }

  getSymbol() {
    return 'kg';
  }

  toKG() {
    return this.weight;
  }
}

module.exports = AmountOfKILOGRAM;
