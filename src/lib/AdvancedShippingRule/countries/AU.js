const CommonRule = require('../CommonRule');

class AustraliaShippingRule extends CommonRule {
  constructor({ weight, price }) {
    super({ weight, price });
    this.handlingFeePercent = 12;
    this.handlingFeeBase = 10;
    this.carrierName = 'USPS (Discounted rates from Shopify Shipping)';
    this.rateName = 'Economy International';
    this.serviceName = 'First Class Package International';
    this.ruleCases = [
      [0, 0.24, 6, 18, 13],
      [0.24, 0.47, 6, 18, 15.5],
      [0.47, 0.92, 6, 18, 22],
      [0.92, 1.38, 6, 18, 28.5],
      [1.38, 1.82, 6, 18, 34],
      [1.82, 2.73, 6, 18, 48],
      [2.73, 4.53, 6, 18, 74],
      [4.53, Infinity, 6, 18, 93],
    ];
  }
}

module.exports = AustraliaShippingRule;
