/* eslint-disable class-methods-use-this */
const Base64 = require('crypto-js/enc-base64');
const Utf8 = require('crypto-js/enc-utf8');
const HMAC_SHA256 = require('crypto-js/hmac-sha256');
const ProviderAbstract = require('../ProviderAbstract');

class Provider extends ProviderAbstract {
  constructor({ entrypoint, merchantId, secret }) {
    super();
    this.entrypoint = entrypoint;
    this.merchantId = merchantId;
    this.secret = secret;
  }

  getMerchantId() {
    return this.merchantId;
  }

  getName() {
    return 'WireCard';
  }

  getGQLSchema() {
    const input = `
          input ${this.getGQLInputName()} {
            """This is not working yet"""
            notImplementedYet: String!
          }
      `;

    return input;
  }

  async addMethod() {
    return null;
  }

  generateSignatureV2({
    date, transactionId, transactionType, currencyAmount, currency,
  }) {
    const dateISO = date.toISOString();

    const payload = [
      'HS256',
      `request_time_stamp=${dateISO.substr(0, dateISO.length - 5)}Z`,
      `merchant_account_id=${this.merchantId}`,
      `request_id=${transactionId}`,
      `transaction_type=${transactionType}`,
      `requested_amount=${currencyAmount}`,
      `requested_amount_currency=${currency}`,
    ]
      .join('\n');

    const payloadBase64 = Base64.stringify(Utf8.parse(payload));
    const digestSecret = HMAC_SHA256(payload, this.secret).toString(Base64);

    return `${payloadBase64}.${digestSecret}`;
  }
}

module.exports = Provider;
