/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const path = require('path');
const stripe = require('stripe');
const { UserInputError } = require('apollo-server');
const ProviderAbstract = require('../ProviderAbstract');
const { PaymentException } = require('../../Exceptions');
const { response } = require('../../../../viewers');

const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));

const logger = require(path.resolve('config/logger'));

class Provider extends ProviderAbstract {
  constructor({ secret }, repository) {
    super();
    this.client = stripe(secret);
    this.repository = repository;
  }

  getName() {
    return 'Stripe';
  }

  getGQLSchema() {
    const input = `
          input ${this.getGQLInputName()} {
              token: String!
          }
      `;

    return input;
  }

  async addMethod({ token }, { dataSources: { repository }, user }) {
    if (!user.email) {
      throw new UserInputError('User does not have email address! Emal is required', { invalidArgs: ['user'] });
    }

    let customer = await repository.paymentStripeCustomer.getByUserId(user.id);
    let paymentMethodResponse;
    if (customer && customer.customerId) {
      try {
        paymentMethodResponse = await this.client.customers.createSource(customer.customerId, { source: token });
      } catch (error) {
        logger.error(`[PAYMENT][STRIPE][ADD_CUSTOMER] failed "${error.message}"`);
        throw new UserInputError('Can\'t add card, try later', { invalidArgs: ['token'] });
      }
    } else {
      let customerResponse;
      try {
        customerResponse = await this.client.customers.create({
          source: token,
          email: user.email,
        });
      } catch (error) {
        logger.error(`[PAYMENT][STRIPE][ADD_CUSTOMER] failed "${error.message}"`);
        throw new UserInputError('Can\'t add card, try later', { invalidArgs: ['token'] });
      }

      if (!customerResponse || !customerResponse.id) {
        logger.error(`[PAYMENT][STRIPE][ADD_CUSTOMER] response is empty ${JSON.stringify(customer)}`);
        throw new UserInputError('Can\'t add card, try later', { invalidArgs: ['token'] });
      }

      // Create Stripe Customer in DB
      const stripeCustomerData = {
        user: user.id,
        customerId: customerResponse.id,
        paymentMethods: [],
      };
      customer = await repository.paymentStripeCustomer.create(stripeCustomerData);

      if (customerResponse.sources
        && customerResponse.sources.object
        && customerResponse.sources.object === 'list'
        && customerResponse.sources.total_count > 0
      ) {
        [paymentMethodResponse] = customerResponse.sources.data;
      } else {
        logger.error(`[PAYMENT][STRIPE][ADD_CREDITCARD] customer without payment methods ${JSON.stringify(customerResponse)}`);
        throw new UserInputError('Can\'t add card, try later', { invalidArgs: ['token'] });
      }
    }

    // Create Payment Method in DB
    const expiredAt = new Date(`01.${paymentMethodResponse.exp_month}.20${paymentMethodResponse.exp_year}`);
    expiredAt.setMonth(1); // Usualy card works during expire month

    const paymentMethodData = {
      user: user.id,
      provider: this.getName(),
      providerIdentity: paymentMethodResponse.id,
      name: `${paymentMethodResponse.brand} ...${paymentMethodResponse.last4}`,
      expiredAt,
      data: paymentMethodResponse,
      usedAt: new Date(),
    };
    const paymentMethod = await repository.paymentMethod.create(paymentMethodData);

    // Update Customer and set the method
    customer.paymentMethods.push(paymentMethod.id);
    await customer.save();

    return paymentMethod;
  }

  async payTransaction(transaction) {
    // try get Stripe Customer by Buyer ID
    const stripeCustomer = await this.repository.paymentStripeCustomer
      .getByUserId(transaction.buyer);

    if (!stripeCustomer) {
      throw new PaymentException(`[STRIPE] The stripe customer is not find in DB by id ${transaction.buyer}`);
    }

    try {
      const paymentMethodId = transaction.paymentMethod.id || transaction.paymentMethod;
      const method = await this.repository.paymentMethod.getById(paymentMethodId);

      const response = await this.client.charges.create({
        amount: transaction.amount,
        currency: transaction.currency.toLowerCase(),
        customer: stripeCustomer.customerId,
        source: method.providerIdentity,
        metadata: {
          transaction_id: transaction.id,
          tags: transaction.tags.join(','),
        },
      });

      if (response && response.status && response.status === 'succeeded') {
        transaction.status = PaymentTransactionStatus.SUCCESS;
        transaction.providerTransactionId = response.id;
        transaction.responsePayload = JSON.stringify(response);
        transaction.processedAt = new Date(response.created);
        await transaction.save();
      } else {
        transaction.status = PaymentTransactionStatus.FAIL;
        transaction.providerTransactionId = response.id ? response.id : 'none';
        transaction.responsePayload = JSON.stringify(response);
        transaction.processedAt = response.created ? new Date(response.created) : new Date();
        await transaction.save();
      }
      logger.info(`[PAYMENT][STRIPE][PAY_TRANSACTION][${transaction.id}] ${transaction.status}`);
    } catch (error) {
      logger.error(`[PAYMENT][STRIPE][PAY_TRANSACTION] failed ${error.name}: ${error.message}`);
    }

    return transaction;
  }

  async createPaymentIntent(currency, amount, buyer) {
    if(!this.client)
      console.log("Stripe Connectin Error !");
    let newCustomer;

    const customer = await this.repository.paymentStripeCustomer
      .getByUserId(buyer);

    if(!customer) {
      const user = await this.repository.user.getById(buyer);
      newCustomer = await this.client.customers.create({
        email: user.email
      }).then((response) => this.repository.paymentStripeCustomer.create({
        user: user.id,
        customerId: response.id,
        paymentMethods: [],
      })).catch((error) => {
        console.log(error);
        return false;
      });

      if(!newCustomer)
        return {
          error: 'Creating new Stripe customer failed!'
        };
    } else {
      newCustomer = customer;
    }

    try {
      const response = await this.client.paymentIntents.create({
        amount: amount,
        currency: currency.toLowerCase(),
        customer: newCustomer.customerId
      });

      return response;
    } catch (error) {
      return {
        error: error.raw.message,
      }
    }
  }
}
module.exports = Provider;
