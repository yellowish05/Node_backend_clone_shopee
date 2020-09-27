/* eslint-disable global-require */
const path = require('path');

const { payment } = require(path.resolve('config'));

const payPurchaseOrderAction = require('./actions/payPurchaseOrder');

const providers = {
  WIRECARD: require('./providers/WireCard'),
  Stripe: require('./providers/Stripe'),
  RazorPay: require('./providers/RazorPay'),
  LinePay: require('./providers/LinePay')
};

if (payment.testMode) {
  providers.FAKE = require('./providers/Fake');
}

const bundle = {
  providers,
  availableProviders() {
    return Object.values(providers).map((provider) => provider.getName());
  },
  getProvider(name) {
    const [provider] = Object.values(providers).filter((item) => item.getName() === name);
    return provider;
  },
};
bundle.payPurchaseOrder = payPurchaseOrderAction(bundle);

module.exports = bundle;
