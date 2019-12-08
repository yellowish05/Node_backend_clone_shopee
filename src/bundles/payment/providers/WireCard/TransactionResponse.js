const path = require('path');
const Base64 = require('crypto-js/enc-base64');
const Utf8 = require('crypto-js/enc-utf8');

const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));

const CryptoAlgs = require(path.resolve('src/lib/CryptoAlgs'));

const stateStatusMapping = {
  success: PaymentTransactionStatus.SUCCESS,
  failure: PaymentTransactionStatus.FAIL,
};

class TransactionResponse {
  constructor({
    bodyBase64, algorithm, digestBase64, merchantId, secret,
  }) {
    this.payloadBase64 = bodyBase64;
    this.algorithm = algorithm;
    this.digest = digestBase64;
    this.merchantId = merchantId;
    this.secret = secret;
  }

  get payload() {
    return Base64.parse(this.payloadBase64).toString(Utf8);
  }

  get data() {
    return JSON.parse(this.payload);
  }

  isValid() {
    if (!CryptoAlgs[this.algorithm]) {
      return false;
    }
    const algorithm = CryptoAlgs[this.algorithm];

    if (algorithm(this.payload, this.secret) !== this.digest) {
      return false;
    }

    return true;
  }

  getTransactionId() {
    const { payment } = this.data;
    return payment['request-id'];
  }

  getProviderTransactionId() {
    const { payment } = this.data;
    return payment['transaction-id'];
  }

  getState() {
    const { payment } = this.data;
    return payment['transaction-state'];
  }

  getStatus() {
    return stateStatusMapping[this.getState()] || PaymentTransactionStatus.FAIL;
  }

  getAmountOfMoney() {
    const { payment } = this.data;
    return payment['requested-amount'];
  }

  getDate() {
    const { payment } = this.data;
    return new Date(payment['completion-time-stamp']);
  }
}

module.exports = TransactionResponse;
