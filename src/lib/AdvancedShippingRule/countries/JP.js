/**
 * DDU - Major EU/AS/LA
 * Israel, Hong Kong SAR, Japan, Russia, Singapore, South Korea, Austria, Croatia, Finland, Gibraltar, Greece, Hungary, Ireland, Latvia, Lithuania, Luxembourg, Malta, Norway, Poland, Portugal, Sweden, Switzerland
 */
const CommonRule = require("../CommonRule");

class JapanShippingRule extends CommonRule {
  constructor({ weight, price }) {
    super({ weight, price });
    this.handlingFeePercent = 12;
    this.handlingFeeBase = 10;
    this.carrierName = "USPS (Discounted rates from Shopify Shipping)";
    this.rateName = "Economy International";
    this.serviceName = "First Class Package International";
    this.ruleCases = [
      [0, 0.24, 6, 18, 10],
      [0.24, 0.47, 6, 18, 14],
      [0.47, 0.92, 6, 18, 21],
      [0.92, 1.38, 6, 18, 29],
      [1.38, 1.82, 6, 18, 35],
      [1.82, 2.73, 6, 18, 49],
      [2.73, 4.53, 6, 18, 63.5],
      [4.53, Infinity, 6, 18, 83],
    ];
  }
}

module.exports = JapanShippingRule;
