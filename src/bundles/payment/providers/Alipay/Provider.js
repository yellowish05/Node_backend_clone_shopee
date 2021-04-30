/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const path = require('path');
const { UserInputError } = require('apollo-server');
var Alipay = require('alipay-nodejs');

const ProviderAbstract = require('../ProviderAbstract');
const { PaymentException } = require('../../Exceptions');
const { response } = require('../../../../viewers');
const { domain, protocol } = require(path.resolve('config'));
const { error } = require('console');
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));

const activity = {
  generateErrorString: (error) => {
    if (error.response.details) {
      return error.response.details.map(detail => detail.issue).join('; ');
    }
    return error.response.message;
  },
};
const fs = require('fs')

class Provider extends ProviderAbstract {
  constructor(repository) {
    super();
    // let private_key=fs.readFileSync(path.join(__dirname,'private.txt'))
    const privateKey = fs.readFileSync(path.join(__dirname, 'private.txt'));
    const publicKey = fs.readFileSync(path.join(__dirname, 'public.txt'));
    // const publicKey = fs.readFileSync(path.join(__dirname, 'sandboxPublic.txt'));
    this.client = new Alipay({
      app_id: '2021002131638022',
      // app_id: '2021000117621395', // sandbox
      notify_url: 'https://xiufu88.com/callback/alipay',
      app_private_key: privateKey,
      alipay_public_key: publicKey,
    });
    this.repository = repository;
  }

  getName() {
    return 'Alipay';
  }

  getGQLSchema() {
    const input = `
          input ${this.getGQLInputName()} {
              token: String!
          }
      `;
    return input;
  }

  async createOrder(currency, amount, buyer, redirection) {
    // amount is in cents
    console.log('buildSignOrderParam===>',this.client)
    const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: amount, currency });
    if (!this.client) console.log("Alipay Connection Error !");
    const paymentReqJson={
      body: '对一笔交易的具体描述信息。如果是多种商品，请将商品描述字符串累加传给body',
      subject: '大乐透',
      out_trade_no: 'xifu88' + Math.random().toString().substr(2, 10),
      total_amount: amountOfMoney.getCurrencyAmount(),
      timeout_express: '90m',
      product_code: 'Test Product',
    };
    const result = this.client.buildSignOrderParam(paymentReqJson);
    console.log('alipay result',result);
    const baseUrl = 'https://openapi.alipay.com/gateway.do?';
    // const baseUrl = 'https://openapi.alipaydev.com/gateway.do/?';
    return baseUrl + result;

  }
}
module.exports = Provider;
