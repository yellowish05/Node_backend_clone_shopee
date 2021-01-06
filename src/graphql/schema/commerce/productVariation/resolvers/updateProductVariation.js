
const path = require("path");
const { Validator } = require("node-input-validator");
const { UserInputError, ForbiddenError, ApolloError } = require("apollo-server");

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();


module.exports = async (_, { id, data }, { dataSources: { repository }, user }) => {
  const validator = new Validator({
    id,
    ...data,
  }, {
    id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
  })

  return validator.check()
    .then(matched => {
      if (!matched) throw errorHandler.build(validator.errors);

      return repository.productVariation.getById(id);
    })
    .then(productVariation => {
      const keys = ['name', 'description', 'values', 'keyName'];
      keys.forEach(key => {
        productVariation[key] = data[key] || productVariation[key];
      });

      return productVariation.save();
    })
}
