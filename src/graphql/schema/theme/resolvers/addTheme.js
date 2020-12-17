
const uuid = require("uuid/v4");
const path = require("path");
const { Validator } = require("node-input-validator");
const { UserInputError, ApolloError } = require("apollo-server");

const { ErrorHandler } = require(path.resolve("src/lib/ErrorHandler"));
const errorHandler = new ErrorHandler();

module.exports = async (_, { data }, { dataSources: { repository }, user }) => {
  const validator = new Validator(data, {
    name: "required",
    hashtags: "required",
    thumbnail: "required",
  });

  validator.addPostRule(async provider => {
    await Promise.all([
      repository.theme.getByName(provider.inputs.name),
      repository.asset.getById(provider.inputs.thumbnail),
      provider.inputs.productCategories ? repository.productCategory.findByIds(provider.inputs.productCategories) : [],
      provider.inputs.brandCategories ? repository.brandCategory.findByIds(provider.inputs.brandCategories) : [],
      provider.inputs.brands ? repository.brand.getByIds(provider.inputs.brands) : [],
    ])
    .then(([ themeByName, thumbnail, productCategories, brandCategories, brands ]) => {
      if (themeByName) provider.error('name', 'custom', `Theme with name "${provider.inputs.name}" already exists!`);

      if (!thumbnail) provider.error('thumbnail', 'custom', `Asset with id "${provider.inputs.thumbnail}" does not exist!`);

      if (provider.inputs.productCategories && productCategories) {
        const pcObj = {};
        productCategories.forEach(pcItem => pcObj[pcItem._id] = pcItem);
        const nonExistIds = provider.inputs.productCategories.filter(id => !pcObj[id]);
        nonExistIds.length > 0 ? provider.error('productCategories', 'custom', `Product categories with ids "${nonExistIds.join(", ")}" do not exist!`) : null;
      }

      if (provider.inputs.brandCategories && brandCategories) {
        const bcObj = {};
        brandCategories.forEach(bcItem => bcObj[bcItem._id] = bcItem);
        const nonExistIds = provider.inputs.brandCategories.filter(id => !bcObj[id]);
        nonExistIds.length > 0 ? provider.error('brandCategories', 'custom', `Brand categories with ids "${nonExistIds.join(", ")}" do not exist!`) : null;
      }

      if (provider.inputs.brands && brands) {
        const brandObj = {};
        brands.forEach(brand => brandObj[brand._id] = brand);
        const nonExistIds = provider.inputs.brands.filter(id => !brandObj[id]);
        nonExistIds.length > 0 ? provider.error('brands', 'custom', `Brands with ids "${nonExistIds.join(", ")}" do not exist!`) : null;
      }
    })
  });

  return validator.check()
    .then(matched => {
      if (!matched) throw errorHandler.build(validator.errors);

      return repository.theme.create(data);
    })
}
