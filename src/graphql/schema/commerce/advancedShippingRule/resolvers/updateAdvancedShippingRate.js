const path = require("path");
const niv = require("node-input-validator");
const { UserInputError, ForbiddenError } = require("apollo-server");

const { CurrencyFactory } = require(path.resolve("src/lib/CurrencyFactory"));

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

module.exports = (_, { id, data }, { dataSources: { repository }, user }) => {
  const validator = new niv.Validator(
    { id, ...data },
    {
      id: "required",
      rate: "required",
      days: "required",
      priceFrom: "requiredWithout:weightFrom|requiredWith:priceTo",
      priceTo: "requiredWith:priceFrom",
      currency: "requiredWith:priceFrom",
      weightFrom: "requiredWithout:priceFrom|requiredWith:weightTo",
      weightTo: "requiredWith:weightFrom",
      unit: "requiredWith:weightFrom",
    }
  );

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
    .then(async (matched) => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }

      const rate = await repository.advancedShippingRate.getById(id);
      if (!rate) {
        validator.addError(
          "id",
          "existance",
          "Not found the advanced shipping rate!"
        );
        throw errorHandler.build(validator.errors);
      }

      const rule = await repository.advancedShippingRule.getById(rate.rule);

      if (!rule) {
        validator.addError(
          "rule",
          "required",
          `Rule with id "${data.rule}" does not exist!`
        );
      }
      if (rule.owner !== user.id) {
        validator.addError("rule", "ownership", "You are not the owner!");
      }
      if (validator.errors.length) {
        throw errorHandler.build(validator.errors);
      }
      return rate;
    })
    .then((rate) => {
      if (data.priceFrom) {
        const { priceFrom, priceTo, currency } = data;
        rate.priceFrom = CurrencyFactory.getAmountOfMoney({
          currencyAmount: priceFrom,
          currency,
        }).getCentsAmount();

        rate.priceTo = CurrencyFactory.getAmountOfMoney({
          currencyAmount: priceTo,
          currency,
        }).getCentsAmount();
      }

      rate.rate = CurrencyFactory.getAmountOfMoney({
        currencyAmount: data.rate,
        currency: data.currency,
      }).getCentsAmount();

      rate.weightFrom = data.weightFrom;
      rate.weightTo = data.weightTo;
      rate.unit = data.unit;
      rate.days = data.days;

      return rate.save();
    })
    .catch((error) => {
      console.log("[Error]", error);
      throw error;
    });
};
