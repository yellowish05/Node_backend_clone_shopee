/**
 * DDP - Asia
 * China, India, Thailand
 */
const CommonRule = require("../CommonRule");

class ChinaShippingRule extends CommonRule {
  constructor({ weight, price }) {
    super({ weight, price });
    this.handlingFeePercent = 12;
    this.handlingFeeBase = 10;
    this.carrierName = "USPS (Discounted rates from Shopify Shipping)";
    this.rateName = "Economy International";
    this.serviceName = "First Class Package International";
    this.ruleCases = [
      [0, 0.24, 6, 18, 15.5],
      [0.24, 0.47, 6, 18, 17.5],
      [0.47, 0.92, 6, 18, 22.5],
      [0.92, 1.38, 6, 18, 28.5],
      [1.38, 1.82, 6, 18, 34.5],
      [1.82, 2.73, 6, 18, 45.5],
      [2.73, 4.53, 6, 18, 66.5],
      [4.53, Infinity, 6, 18, 81.5],
    ];
  }
}

module.exports = ChinaShippingRule;
