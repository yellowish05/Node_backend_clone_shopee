const path = require('path');
const uuid = require('uuid/v4');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const ordersBundle = require(path.resolve('src/bundles/orders'));
const repository = require(path.resolve('src/repository'));
const { PaymentMethodIsUnactiveException, PaymentMethodUsesWrongProviderException } = require('../Exceptions');

const { PaymentTransactionStatus } = require(path.resolve('src/lib/Enums'));
const logger = require(path.resolve('config/logger'));
const { payment } = require(path.resolve('config'));


function paymentTransactionFactory(order) {
  return {
    _id: uuid(),
    buyer: order.buyer,
    createdAt: new Date(),
    amount: order.total,
    currency: order.currency,
    status: PaymentTransactionStatus.PENDING,
    tags: [order.getTagName()],
  };
}

async function generateWireCardPaymentForOrder(order, wirecardProvider) {
  const transaction = {
    ...paymentTransactionFactory(order),
    merchant: wirecardProvider.getMerchantId(),
    type: 'purchase',
  };

  const amountISO = CurrencyFactory.getAmountOfMoney({
    centsAmount: transaction.amount,
    currency: transaction.currency,
  });

  const transactionRequest = wirecardProvider.createTransactionRequest({
    date: transaction.createdAt,
    transactionId: transaction._id,
    transactionType: transaction.type,
    currencyAmount: amountISO.getCurrencyAmount(),
    currency: transaction.currency,
  });

  transaction.signature = transactionRequest.getSignature();

  // eslint-disable-next-line no-param-reassign
  order.payments.push(transaction._id);

  return Promise.all([
    repository.paymentTransaction.create(transaction),
    order.save(),
  ])
    .then(([trans]) => trans);
}

module.exports = ({ getProvider, availableProviders }) => async ({ order, paymentMethod }) => {
  if (!paymentMethod) {
    return generateWireCardPaymentForOrder(order, getProvider('WireCard'));
  }
  let transaction;
  let method;

  if(paymentMethod !== "applePay" && paymentMethod !== "googlePay") {
    method = await repository.paymentMethod.getById(paymentMethod);

    if (!method) {
      throw new PaymentMethodIsUnactiveException(`Payment method id "${paymentMethod}" doesn't exist`);
    }
  
    if (!method.isActive) {
      throw new PaymentMethodIsUnactiveException(`Payment method "${method.name}" can't use`);
    }
  
    if (!availableProviders().includes(method.provider)) {
      throw new PaymentMethodUsesWrongProviderException(`The provider "${method.provider}" is not supported in payment method "${method.id}"`);
    }
  
    // Create and Save Transaction for Purchase Order
    transaction = await repository.paymentTransaction.create(
      {
        ...paymentTransactionFactory(order),
        paymentMethod: method,
      },
    );
  } else if (paymentMethod === "applePay"){
    transaction = await repository.paymentTransaction.create(
      {
        ...paymentTransactionFactory(order),
        paymentMethod: "applePay",
      },
    );
  } else if (paymentMethod === "googlePay"){
    transaction = await repository.paymentTransaction.create(
      {
        ...paymentTransactionFactory(order),
        paymentMethod: "googlePay",
      },
    );
  }

  // Add transaction to the order and save it
  order.payments.push(transaction.id);
  await order.save();

  // Pay the transaction here
  try {
    let methodProvider;
    if(paymentMethod === 'applePay' || paymentMethod === "googlePay") {
      methodProvider = 'Stripe';
    } else {
      methodProvider = method.provider;
    }

    if(methodProvider.toLowerCase() == 'stripe') {
      const stripe = payment.providers.stripe;
      
      return getProvider(methodProvider).createPaymentIntent(transaction.currency, transaction.amount, transaction.buyer)
      .then((paymentIntent) => {
        if(paymentIntent.error) {
          return paymentIntent;
        } else {
          return {
            publishableKey: stripe.publishable,
            paymentClientSecret: paymentIntent.client_secret
          };
        }
      })
    } else {
      await getProvider(method.provider).payTransaction(transaction);
    }
    await transaction.save();

    if (transaction.isSuccessful()) {
      await ordersBundle.executeOrderPaidFlow(order);
    } else {
      await ordersBundle.executeOrderFailFlow(order);
    }
  } catch (error) {
    await ordersBundle.executeOrderFailFlow(order);
    logger.error(`${error.name}: ${error.message}`);
  }
  return transaction;
};
