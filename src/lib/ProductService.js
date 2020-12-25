
const path = require('path');
const { slugify } = require('transliteration');

const repository = require(path.resolve('src/repository'));

module.exports = {
  async analyzeTheme(id) {
    const themeContent = { brands: [], productCategories: [], hashtags: [] };

    if (!id) return themeContent;

    const theme = await repository.theme.getById(id);

    if (!theme) return themeContent;

    let { brandCategories, brands, productCategories, hashtags } = theme;

    if (brandCategories.length || hashtags.length) {
      brandCategories = await repository.brandCategory.getByIdsAndTags(brandCategories, hashtags);
    }

    const brandCategoryIds = brandCategories.map(brandCategory => brandCategory._id);

    if (brandCategories.length || hashtags.length) {
      brands = await repository.brand.getByCategoryAndTags(brandCategoryIds, hashtags);
    }

    if (productCategories.length || brands.length || hashtags.length) {
      if (brands.length) {
        brands.forEach(brand => {
          productCategories.concat(brand.productCategories);
        });
      }
      productCategories = await repository.productCategory.getUnderParents(productCategories, hashtags);
    }

    return { brands, productCategories, hashtags };
  },
  async generateSlug({ id, slug: slugInput, title }) {
    return Promise.all([
      slugInput ? repository.product.getBySlug(slugInput) : null,
      repository.product.getAll({ title }),
    ])
      .then(([productBySlug, productsByTitle]) => {
        if (slugInput && (!productBySlug || (productBySlug && productBySlug._id === id))) return slugInput;

        const otherProducts = productsByTitle.filter(product => product._id !== id);
        let slug = slugify(title);
        if (otherProducts.length) {
          const rand = Math.floor(Math.random() * 1000);
          slug += `-${rand.toString().padStart(3, '0')}`;
        }
        return slug;
      })
  },
}