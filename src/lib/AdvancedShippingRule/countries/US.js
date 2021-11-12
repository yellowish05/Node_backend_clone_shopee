const CommonRule = require("../CommonRule");

class AustraliaShippingRule extends CommonRule {
  constructor({ weight, price }) {
    super({ weight, price });
    this.handlingFeePercent = 12;
    this.handlingFeeBase = 10;
    this.carrierName = "USPS (Discounted rates from Shopify Shipping)";
    this.rateName = "";
    this.serviceName = "Priority Mail";
    this.ruleCases = [];
  }
}

module.exports = AustraliaShippingRule;
