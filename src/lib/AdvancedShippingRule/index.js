/**
 * @ Advanced Shipping Rules
 * @description The company specific delivery service.
 * @param { string } countryCode The country code
 * @param { Weight } weight The weight object of the parcel. Refer to lib/WeightFactory
 * @param { Price } price The price object of the parcel price. Refer to lib/CurrencyFactory
 * @return { object }
 * @member { Price } handlingFee handling fee.
 * @member { Price } shippingFee shipping fee.
 * @member {{ from, to }} days shipping days.
 *  */
const requireDir = require('require-dir');
const CommonRule = require('./CommonRule');
const rules = requireDir('./countries');

const COUNTRY_GROUP = {
  AE: ['AE', 'ZA', 'BH', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'OM', 'QA', 'SA', 'TN', 'YE', 'DZ', 'AO', 'BJ', 'BW', 'BF', 'BI', 'CM', 'CV', 'CF', 'TD', 'KM', 'CD', 'CG', 'CI', 'DJ', 'GQ', 'ER', 'ET', 'GA', 'GM', 'GH', 'GN', 'GW', 'KE', 'LS', 'LR', 'MG', 'MW', 'ML', 'MR', 'MU', 'MA', 'MZ', 'NA', 'NE', 'NG', 'RW', 'ST', 'SN', 'SC', 'TZ', 'TG', 'UG', 'ZM', 'ZW'],
  AU: ['AU'],
  CN: ['CN', 'IN', 'TH'],
  JP: ['IL', 'HK', 'JP', 'RU', 'SG', 'KR', 'AT', 'HR', 'FI', 'GI', 'GR', 'HU', 'IE', 'LV', 'LT', 'LU', 'MT', 'NO', 'PL', 'PT', 'SE', 'CH'],
  NZ: ['NZ'],
  UK: ['UK'],
  US: ['US'],
};

const advancedShippingRule = ({ countryCode, weight, price }) => {
  const findShippingRule = (countryCode) => {
    const [REPR_KEY] = Object.keys(COUNTRY_GROUP).filter(KEY => COUNTRY_GROUP[KEY].includes(countryCode));
    if (REPR_KEY) {
      return rules[REPR_KEY];
    } else {
      return CommonRule;
    }
  }
  const ShippingRule = findShippingRule(countryCode);
  const shippingRule = new ShippingRule({ weight, price });
  return Promise.all([
    shippingRule.getHandlingFee(),
    shippingRule.getShippingFee(),
    shippingRule.getShippingDays(),
  ])
    .then(([handlingFee, shippingFee, days]) => ({
      handlingFee, shippingFee, days,
    }));
}

module.exports = advancedShippingRule;
