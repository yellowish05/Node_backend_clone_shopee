/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const path = require('path');
const paypal = require('paypal-rest-sdk');
const { UserInputError } = require('apollo-server');
const ProviderAbstract = require('../ProviderAbstract');
const { PaymentException } = require('../../Exceptions');
const { response } = require('../../../../viewers');
const { domain, protocol } = require(path.resolve('config'));
const { error } = require('console');
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));

const logger = require(path.resolve('config/logger'));

class Provider extends ProviderAbstract {
  constructor({ mode, client_id, client_secret }, repository) {
    super();
    this.client = paypal;
    this.client.configure({
        mode,
        client_id,
        client_secret,
    });
    this.repository = repository;
  }

  getName() {
    return 'PayPal';
  }

  getGQLSchema() {
    const input = `
          input ${this.getGQLInputName()} {
              token: String!
          }
      `;
    return input;
  }

  async createOrder(currency, amount, buyer) {
    // amount is in cents
    const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: amount, currency });
    if(!this.client)
      console.log("PayPal Connection Error !");
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": 'https://mojie-api.shoclef.com/pages/paypal/success', //`${protocol}://${domain}/pages/paypal/success`,
            "cancel_url": 'https://mojie-api.shoclef.com/pages/paypal/cancel', //`${protocol}://${domain}/pages/paypal/cancel`
        },
        "transactions": [{
            "amount": {
                "currency": currency,
                "total": amountOfMoney.getCurrencyAmount()
            },
        }]
    };
    return new Promise(resolve => {
        this.client.payment.create(create_payment_json, (error, payment) => {
            if (error) {
                resolve({error: error.message});
            } else {
                resolve(payment);
            }
        });
    });
  }
}
module.exports = Provider;
