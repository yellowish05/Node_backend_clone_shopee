
const path = require('path');
const { slugify } = require('transliteration');

const repository = require(path.resolve('src/repository'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

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
        if (productCategories.length === 0) return [];

        // calculate match count.
        productCategories.forEach(category => {
          category.matchPoint = this.calcKeywordMatchPoint(keywords, category);
        });

        // sort by match point.
        productCategories.sort((a, b) => b.matchPoint - a.matchPoint);
        
        const maxPoint = productCategories[0].matchPoint;
        
        return Promise.all(productCategories
          // .filter(item => item.matchPoint === maxPoint)
          .map(item => repository.productVariation.getByCategory(item._id))
        )
          .then((variationsArray) => {
            variationsArray = variationsArray.filter(el => el.length > 0);
            const [variations] = variationsArray.filter(el => el.length === Math.max(...variationsArray.map(el => el.length)));
            return variations || [];
          })
      })
  },
  async attributeFilter({ searchQuery: keyword }) {
    if (!keyword.trim()) return [];

    const keywords = keyword.split(' ').map(item => item.trim());

    const query = { $or: [] };
    query.$or = keywords.map(kwd => ({ hashtags: { $regex: `${kwd}`, $options: 'i' } }));

    return repository.productCategory.getAll(query)
      .then(productCategories => {
        if (productCategories.length === 0) return [];

        // calculate match count.
        productCategories.forEach(category => {
          category.matchPoint = this.calcKeywordMatchPoint(keywords, category);
        });

        // sort by match point.
        productCategories.sort((a, b) => b.matchPoint - a.matchPoint);
        
        const maxPoint = productCategories[0].matchPoint;
        
        return Promise.all(productCategories
          // .filter(item => item.matchPoint === maxPoint)
          .map(item => repository.productVariation.getByCategory(item._id))
        )
          .then((variationsArray) => {
            // WI = With Index.
            const pcWI = productCategories.map((item, i) => ({ index: i, value: item }));
            const vaWI = variationsArray.map((item, i) => ({ index: i, value: item }));

            const [pcWIbyName] = pcWI.filter(item => item.value.name === keyword);
            const [vaWI_MaxLen] = vaWI.filter(item => item.value.length === Math.max(...variationsArray.map(el => el.length)));

            const selIndex = pcWIbyName ? pcWIbyName.index : vaWI_MaxLen.index;
            
            return Promise.all([
              repository.productCategory.getByParent(pcWI[selIndex].value.id),
              vaWI[selIndex].value
            ]);
          })
          .then(([productCategories, productVariations]) => ({ productCategories, productVariations }))
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
  },
  async getAttributesFromVariations(variations = []) {
    variations = variations.filter(variation => !variation.name && !variation.value);
    if (!variations.length) return [];
    const query = { $and: variations.map(variation => ({ variation: { $elemMatch: variation } }))};

    return repository.productAttributes.getAll(query);
  },
  async exchangeOnSupportedCurrencies(price) {
    const currencies = CurrencyFactory.getCurrencies();

    const exchangePromises = currencies.map(async (currency) => {
      const amountOfMoney = CurrencyFactory.getAmountOfMoney({
        currencyAmount: price.amount, currency: price.currency,
      });
  
      if (price.currency === currency) {
        return { amount: amountOfMoney.getCentsAmount(), currency };
      }
  
      return CurrencyService.exchange(amountOfMoney, currency)
        .then((money) => ({ amount: money.getCentsAmount(), currency }));
    });
  
    return Promise.all(exchangePromises);
  },
  async convertToUSD(price) {
    const amountOfMoney = CurrencyFactory.getAmountOfMoney({ currencyAmount: price.amount, currency: price.currency });
    if (price.currency && price.currency !== "USD") {
      return CurrencyService.exchange(amountOfMoney, "USD");
    }
    return amountOfMoney;
  },
  async productInLivestream() {
    return repository.liveStream.getAll({"productDurations.0": {"$exists": true}})
    .then(livestreams => (livestreams.map(livestream => (livestream.productDurations.map(item => item.product)))))
    .then(arrays => [].concat(...arrays))
    .then(productIds => productIds.filter((v, i, a) => a.indexOf(v) === i))
  },
  async composeProductFilter(filter, user = null) {
    if (user) {
      filter.blackList = user.blackList;
    }
      
    if (filter.categories) {
      // get categories by id and slug
      const categories = await repository.productCategory.getAll({ $or: [
        { _id: {$in: filter.categories }}, 
        { slug: { $in: filter.categories }}
      ] });
      await repository.productCategory.getUnderParents(categories.map(item => item._id))
        .then(categories => {
          filter.categories = categories.map(item => item.id);
        })
    }

    if (filter.price) {
      if (filter.price.min) {
        // const minPrices = await this.exchangeOnSupportedCurrencies(filter.price.min);
        // const [minInUSD] = minPrices.filter(el => el.currency === 'USD');
        // filter.price.min = minPrices;

        const amount = await this.convertToUSD(filter.price.min);
        const cent = amount.getCentsAmount();
        filter.price.min1 = { amount: cent, currency: amount.getCurrency() };
      }

      if (filter.price.max) {
        // const maxPrices = await this.exchangeOnSupportedCurrencies(filter.price.max);
        // const maxInUSD = maxPrices.filter(el => el.currency === 'USD');
        // filter.price.max = maxPrices;
        // filter.price.max1 = maxInUSD;

        const amount = await this.convertToUSD(filter.price.max);
        const cent = amount.getCentsAmount();
        filter.price.max1 = { amount: cent, currency: amount.getCurrency() };
      }
    }

    if (filter.hasLivestream) {
      const productIds = await this.productInLivestream(repository);
      filter.ids = productIds;
    }

    if (filter.variations) {
      const attributes = await this.getAttributesFromVariations(filter.variations);
      filter.attributes = attributes;
    }

    return filter;
  },
}