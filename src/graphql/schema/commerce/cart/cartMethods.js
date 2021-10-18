const path = require('path');
const repository = require(path.resolve('src/repository'));
const { ShippingRuleType, WeightUnitSystem } = require(path.resolve('src/lib/Enums'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const advancedShippingRule = require(path.resolve('src/lib/AdvancedShippingRule'));
const { getAmountOfWeight, getUnits } = require(path.resolve('src/lib/WeightFactory'));

const _this = {
  getDeliveryPrice: async ({ items }, args) => {
    // delivery price for simple rule
    const cents4SimpleRule = await Promise.all(items
      .filter(({ shippingRule }) => shippingRule === ShippingRuleType.SIMPLE)
      .map(async ({ quantity, deliveryRate }) => {
        let centsAmount = 0;
        if (deliveryRate) {
          centsAmount = deliveryRate.amount * quantity;
          if (args.currency && args.currency !== deliveryRate.currency) {
            const amountOfMoney = CurrencyFactory.getAmountOfMoney({
              centsAmount: centsAmount,
              currency: deliveryRate.currency
            });
            centsAmount = await CurrencyService.exchange(amountOfMoney, args.currency)
              .then((exchangedMoney) => exchangedMoney.getCentsAmount());
          }
        }
        return centsAmount;
      }))
      .then((centAmounts) => centAmounts.reduce((sum, cent) => sum + cent, 0));
    // delivery price for advanced rule
    const mapCountry2Item = {};
    items
      .filter(({ shippingRule }) => shippingRule === ShippingRuleType.ADVANCED)
      .forEach((item) => {
        const country = item.deliveryAddress.address.country;
        if (!mapCountry2Item[country]) mapCountry2Item[country] = [];
        mapCountry2Item[country].push(item);
      });
    // split the items according to the delivery country.
    const cents4AdvancedRule = await Promise.all(Object.keys(mapCountry2Item)
      .map(async (country) => {
        const countryItems = mapCountry2Item[country];
        const weight = _this.getTotalWeight(countryItems);
        const price = await _this.getTotalPrice(countryItems, args.currency);
        console.log('[WeightPrice]', weight, price);
        return advancedShippingRule({
          weight,
          price,
          countryCode: country,
        });
      }))
      .then((ASRs) => ASRs.reduce((cents, ASR) => cents + ASR.shippingFee.getCentsAmount() + ASR.handlingFee.getCentsAmount(), 0));
    return CurrencyFactory.getAmountOfMoney({ centsAmount: cents4SimpleRule + cents4AdvancedRule, currency: args.currency });
  },
  getTotalWeight: (cartItems) => {
    const totalKG = cartItems
      .map(({ product, quantity }) => {
        const amountOfWeight = getAmountOfWeight({
          weight: product.weight.value * quantity,
          unit: product.weight.unit,
        });
        return amountOfWeight.toKG();
      })
      .reduce((sum, kg) => sum + kg, 0);
    console.log('[TotalKG]', totalKG);
    return getAmountOfWeight({ weight: totalKG, unit: WeightUnitSystem.KILOGRAM });
  },
  getTotalPrice: async (cartItems, currency = null) => {
    return Promise.all(cartItems
      .map(({ product, productAttribute, quantity }) => {
        const entity = productAttribute || product;

        const amountOfMoney = CurrencyFactory.getAmountOfMoney(
          { centsAmount: entity.price * quantity, currency: entity.currency },
        );

        if (currency && currency !== entity.currency) {
          return CurrencyService.exchange(amountOfMoney, currency)
            .then((exchangedMoney) => exchangedMoney.getCentsAmount());
        }
        return amountOfMoney.getCentsAmount();
      }))
      .then((centsByCountry) => centsByCountry.reduce((sum, cent) => sum + cent, 0))
      .then(totalCents => CurrencyFactory.getAmountOfMoney({ centsAmount: totalCents, currency: currency }));
  },
};

module.exports = _this;
