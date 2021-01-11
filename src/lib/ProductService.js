
const path = require('path');
const { slugify } = require('transliteration');

const repository = require(path.resolve('src/repository'));

const matchWeightByLevel = [7, 5, 3]; // for level 1, 2, 3

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
  async findProductVariationsFromKeyword(keyword) {
    if (!keyword.trim()) return [];

    const keywords = keyword.split(' ').map(item => item.trim());

    const query = { $or: [] };
    query.$or = keywords.map(kwd => ({ hashtags: { $regex: `${kwd}`, $options: 'i' } }));

    return repository.productCategory.getAll(query)
      .then(productCategories => {
        // calculate match count.
        productCategories.forEach(category => {
          category.matchPoint = this.calcKeywordMatchPoint(keywords, category);
        });

        // sort by match point.
        productCategories.sort((a, b) => b.matchPoint - a.matchPoint);

        return productCategories.length ? 
          repository.productVariation.getByIds(productCategories[0].productVariations) : 
          [];
      })
  },
  calcKeywordMatchPoint(keywords, { hashtags = [], level = 1}) {
    let matches = 0;
    for (const keyword of keywords) {
      const regExp = new RegExp(keyword, 'gi');
      for (const hashtag of hashtags) {
        const matched = hashtag.match(regExp);
        matches += matched ? matched.length : 0;
      }
    }
    return matches * matchWeightByLevel[level - 1];
  },
  composeHashtags(hashtags = [], brand) {
    if (brand && !hashtags.includes(brand.name)) {
      hashtags.includes(brand.name);
    }
    return hashtags;
  }
}