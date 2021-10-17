const path = require('path');
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { getAmountOfWeight } = require('../WeightFactory');
const FROM_KG = 0;
const TO_KG = 1;
const FROM_DAYS = 2;
const TO_DAYS = 3;
const PRICE_USD = 4;

class CommonShippingRule {
  
  constructor({ weight, price }) {
    this.handlingFeePercent = 15;
    this.handlingFeeBase = 12;
    this.carrierName = 'USPS (Discounted rates from Shopify Shipping)';
    this.rateName = 'Economy International';
    this.serviceName = 'First Class Package International';
    this.ruleCases = [];
    this.price = price;
    this.weight = weight;
  }

  /**
   * handling fee: 12% * price + $10
   */
  async getHandlingFee() {
    let fixedFee = CurrencyFactory.getAmountOfMoney({
      currencyAmount: this.handlingFeeBase,
      currency: 'USD',
    });
    
    const fee = CurrencyFactory.getAmountOfMoney({
      centsAmount: this.price.getCentsAmount() * this.handlingFeePercent / 100,
      currency: this.price.getCurrency(),
    });

    if (fixedFee.getCurrency() !== fee.getCurrency()) {
      // then convert the fixed fee into the currency of fee.
      fixedFee = await CurrencyService.exchange(fixedFee, fee.getCurrency());
    }
    return CurrencyFactory.getAmountOfMoney({
      centsAmount: Math.floor(fixedFee.getCentsAmount() + fee.getCentsAmount()),
      currency: fee.getCurrency(),
    });
  }

  async getShippingFee() {
    // rule case: [fromKG, toKG, fromDays, toDays, price(USD)]
    if (this.ruleCases.length === 0) {
      return CurrencyFactory.getAmountOfMoney({
        centsAmount: 0,
        currency: this.price.getCurrency(),
      });
    }
    const weightInKG = this.weight.toKG();
    for (const ruleCase of this.ruleCases) {
      if (weightInKG >= ruleCase[FROM_KG] && weightInKG < ruleCase[TO_KG]) {
        let shippingFee = CurrencyFactory.getAmountOfMoney({
          currencyAmount: ruleCase[PRICE_USD],
          currency: 'USD',
        });
        if (shippingFee.getCurrency() !== this.price.getCurrency()) {
          // then convert the fixed fee into the currency of fee.
          shippingFee = await CurrencyService.exchange(shippingFee, this.price.getCurrency());
        }
        return shippingFee;
      }
    }
  }

  getShippingDays() {
    // rule case: [fromKG, toKG, fromDays, toDays, price(USD)]
    if (this.ruleCases.length === 0) {
      return {
        from: 0,
        to: Infinity,
      };
    }
    const weightInKG = this.weight.toKG();
    for (const ruleCase of this.ruleCases) {
      if (weightInKG >= ruleCase[FROM_KG] && weightInKG < ruleCase[TO_KG]) {
        return {
          from: ruleCase[FROM_DAYS],
          to: ruleCase[TO_DAYS],
        };
      }
    }
  }
}

module.exports = CommonShippingRule;
