const path = require("path");
const niv = require("node-input-validator");
const { UserInputError, ForbiddenError } = require("apollo-server");

const { CurrencyFactory } = require(path.resolve("src/lib/CurrencyFactory"));

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

module.exports = (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new niv.Validator(data, {
    rule: "required|string",
    rate: "required",
    days: "required",
    priceFrom: "requiredWithout:weightFrom|requiredWith:priceTo",
    priceTo: "requiredWith:priceFrom",
    currency: "requiredWith:priceFrom",
    weightFrom: "requiredWithout:priceFrom|requiredWith:weightTo",
    weightTo: "requiredWith:weightFrom",
    unit: "requiredWith:weightFrom",
  });

  niv.addCustomMessages({
    "priceFrom.requiredWithout": "Price or weight is required.",
    "priceFrom.requiredWith": "PriceFrom is required with priceTo",
    "priceTo.requiredWith": "PriceTo is required with priceFrom.",
    "currency.requiredWith": "Currency is required with priceFrom",
    "weightFrom.requiredWithout": "Price or weight is required.",
    "weightFrom.requiredWith": "WeightFrom is required with weightTo",
    "weightTo:requiredWith": "WeightTo is required with weightFrom.",
    "unit.requiredWith": "Unit is required with weightFrom",
  });

  return validator
    .check()
    .then((matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      return repository.advancedShippingRule.getById(data.rule).then((rule) => {
        if (!rule) {
          validator.addError(
            "rule",
            "required",
            `Rule with id "${data.rule}" does not exist!`
          );
          throw errorHandler.build(validator.errors);
        }
        if (rule.owner !== user.id) {
          throw new ForbiddenError("Permission denied!");
        }
      });
    })
    .then(() => {
      if (data.priceFrom) {
        const { priceFrom, priceTo, currency } = data;
        data.priceFrom = CurrencyFactory.getAmountOfMoney({
          currencyAmount: priceFrom,
          currency,
        }).getCentsAmount();

        data.priceTo = CurrencyFactory.getAmountOfMoney({
          currencyAmount: priceTo,
          currency,
        }).getCentsAmount();
      }

      data.rate = CurrencyFactory.getAmountOfMoney({
        currencyAmount: data.rate,
        currency: data.currency,
      }).getCentsAmount();

      return repository.advancedShippingRate.create(data);
    });
};
