const requireDir = require('require-dir');

const weights = requireDir('./units');

module.exports = {
  getAmountOfWeight({ weight, unit }) {
    const WeightStrategy = weights[unit];
    if (!WeightStrategy) {
      throw new Error(`We do not support "${unit}" unit.`);
    }
    return new WeightStrategy(weight);
  },
  getUnits() {
    return Object.keys(weights);
  },
};
