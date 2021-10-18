const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));

const schema = gql`
  type DeliveryPriceGroup {
    id: ID!
    price(currency: Currency): AmountOfMoney!
    deliveryOrders: [DeliveryOrder]
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  DeliveryPriceGroup: {
    price: ({ price, currency }, args) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({ centsAmount: price, currency });
      if (currency !== args.currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    deliveryOrders: ({ deliveryOrders }, _, { dataSources: { repository } }) => repository.deliveryOrder.getByIds(deliveryOrders),
  },
};