/**
 * South Africa - DDU delcon Middle East/ Africa
 * South Africa, Bahrain, Egypt, Iraq, Jordan, Kuwait, Lebanon, Libya, Oman, Qatar, Saudi Arabia, Tunisia, United Arab Emirates, Yemen, Algeria, Angola, Benin, Botswana, Burkina Faso, Burundi, Cameroon, Cape Verde, Central African Republic, Chad, Comoros, Congo - Brazzaville, Congo - Kinshasa, Côte d’Ivoire, Djibouti, Equatorial Guinea, Eritrea, Ethiopia, Gabon, Gambia, Ghana, Guinea, Guinea-Bissau, Kenya, Lesotho, Liberia, Madagascar, Malawi, Mali, Mauritania, Mauritius, Morocco, Mozambique, Namibia, Niger, Nigeria, Rwanda, São Tomé & Príncipe, Senegal, Seychelles, Tanzania, Togo, Uganda, Zambia, Zimbabwe
 */

const CommonRule = require("../CommonRule");

class UAEShippingRule extends CommonRule {
  constructor({ weight, price }) {
    super({ weight, price });
    this.handlingFeePercent = 12;
    this.handlingFeeBase = 10;
    this.carrierName = "USPS (Discounted rates from Shopify Shipping)";
    this.rateName = "Economy International";
    this.serviceName = "First Class Package International";
    this.ruleCases = [
      [0, 0.24, 6, 18, 22],
      [0.24, 0.47, 6, 18, 25],
      [0.47, 0.92, 6, 18, 32],
      [0.92, 1.38, 6, 18, 36],
      [1.38, 1.82, 6, 18, 40],
      [1.82, 2.73, 6, 18, 43],
      [2.73, 4.53, 6, 18, 58],
      [4.53, Infinity, 6, 18, 69],
    ];
  }
}

module.exports = UAEShippingRule;
