const path = require("path");
const { gql } = require("apollo-server");

const { CurrencyService } = require(path.resolve("src/lib/CurrencyService"));
const { CurrencyFactory } = require(path.resolve("src/lib/CurrencyFactory"));

// resolvers
const addAdvancedShippingRule = require("./resolvers/addAdvancedShippingRule");
const addAdvancedShippingRate = require("./resolvers/addAdvancedShippingRate");
const updateAdvancedShippingRule = require("./resolvers/updateAdvancedShippingRule");
const updateAdvancedShippingRate = require('./resolvers/updateAdvancedShippingRate');
const deleteAdvancedShippingRule = require('./resolvers/deleteAdvancedShippingRule');
const deleteAdvancedShippingRate = require("./resolvers/deleteAdvancedShippingRate");

const schema = gql`
  type AdvancedShippingRule {
    id: ID!
    name: String!
    country: Country!
    region: Region
    city: String
    isActive: Boolean!
    rates: [AdvancedShippingRate]
  }

  type AdvancedShippingRate {
    id: ID!
    rule: AdvancedShippingRule!
    priceFrom(currency: Currency): AmountOfMoney!
    priceTo(currency: Currency): AmountOfMoney!
    weightFrom: Weight!
    weightTo: Weight!
    rate: AmountOfMoney!
    days: Int!
  }

  input AdvancedShippingRuleInput {
    name: String!
    country: String!
    region: String
    city: String
    isActive: Boolean = true
  }

  input CreateAdvancedShippingRateInput {
    rule: ID!
    priceFrom: Float
    priceTo: Float
    currency: Currency = USD
    weightFrom: Float
    weightTo: Float
    unit: WeightUnitSystem = KILOGRAM
    rate: Float!
    days: Int!
  }

  input UpdateAdvancedShippingRateInput {
    priceFrom: Float
    priceTo: Float
    currency: Currency = USD
    weightFrom: Float
    weightTo: Float
    unit: WeightUnitSystem = KILOGRAM
    rate: Float!
    days: Int!
  }  

  extend type Query {
    advancedShippingRule(id: ID!): AdvancedShippingRule!
    advancedShippingRate(id: ID!): AdvancedShippingRate!
  }

  extend type Mutation {
    addAdvancedShippingRule(
      data: AdvancedShippingRuleInput
    ): AdvancedShippingRule! @auth(requires: USER)

    addAdvancedShippingRate(
      data: CreateAdvancedShippingRateInput
    ): AdvancedShippingRate! @auth(requires: USER)

    updateAdvancedShippingRule(id: ID!, data: AdvancedShippingRuleInput!): AdvancedShippingRule! @auth(requires: USER)
    updateAdvancedShippingRate(id: ID!, data: UpdateAdvancedShippingRateInput!): AdvancedShippingRate! @auth(requires: USER)
    deleteAdvancedShippingRate(id: ID!): Boolean! @auth(requires: USER)
    deleteAdvancedShippingRule(id: ID!): Boolean! @auth(requires: USER)
  }
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    advancedShippingRule: (_, { id }, { dataSources: { repository } }) =>
      repository.advancedShippingRule.getById(id),
    advancedShippingRate: (_, { id }, { dataSources: { repository } }) =>
      repository.advancedShippingRate.getById(id),
  },
  Mutation: {
    addAdvancedShippingRule,
    addAdvancedShippingRate,
    updateAdvancedShippingRule,
    updateAdvancedShippingRate,
    deleteAdvancedShippingRule,
    deleteAdvancedShippingRate,
  },
  AdvancedShippingRule: {
    country: ({ country }, _, { dataSources: { repository } }) =>
      repository.country.getById(country),
    region: ({ region }, _, { dataSources: { repository } }) =>
      repository.region.getById(region),
    rates: ({ id }, _, { dataSources: { repository } }) =>
      repository.advancedShippingRate.getByRule(id),
  },
  AdvancedShippingRate: {
    rule: ({ rule }, _, { dataSources: { repository } }) =>
      repository.advancedShippingRule.getById(rule),
    priceFrom: (
      { priceFrom, currency },
      args,
      { dataSources: { repository } }
    ) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({
        centsAmount: priceFrom,
        currency,
      });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    priceTo: ({ priceTo, currency }, args, { dataSources: { repository } }) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({
        centsAmount: priceTo,
        currency,
      });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
    weightFrom: ({ weightFrom, unit }, _, { dataSources: { repository } }) => ({
      value: weightFrom,
      unit,
    }),
    weightTo: ({ weightTo, unit }, _, { dataSources: { repository } }) => ({
      value: weightTo,
      unit,
    }),
    rate: ({ rate, currency }, args, { dataSources: { repository } }) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({
        centsAmount: rate,
        currency,
      });
      if (args.currency && args.currency !== currency) {
        return CurrencyService.exchange(amountOfMoney, args.currency);
      }
      return amountOfMoney;
    },
  },
};
