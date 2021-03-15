/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
const path = require('path');
const NodeCache = require('node-cache');
const async = require('async');

const BaseRobot = require('./BaseRobot');

const repository = require(path.resolve('src/repository'));
const { translate } = require(path.resolve('src/lib/TranslateService'));
const { LanguageList } = require(path.resolve('src/lib/Enums'));

const cache = new NodeCache();
const CATEGORY_CONFIG = 'TranslateProduct';

const activity = {
  translate: async () => {
    const products = await repository.product.getAll();
    const languageList = LanguageList.toList();

    const title = {};
    const description = {};
    let index = 0;

    await async.eachLimit(products, 2, async (product, cb) => {
      index++;

      const translatedProduct = await repository.productTranslation.getByProduct(product.id);

      if (!translatedProduct) {
        await Promise.all(languageList.map(async (language) => {
          const tt = await translate(language.toLowerCase(), product.title);
          const dd = await translate(language.toLowerCase(), product.description);

          title[language.toLowerCase()] = tt || product.title;
          description[language.toLowerCase()] = dd || product.description;
        }));

        await repository.productTranslation.addNewProduct({ product: product.id, title, description });
      }

      console.log('Translated Products: ', index);
      // eslint-disable-next-line no-unused-expressions
      cb && cb(null);
    });
  },
};

module.exports = class TranslateProductsRobot extends BaseRobot {
  constructor() {
    super(17 * 60 * 1009);
    cache.set(CATEGORY_CONFIG, { position: 0, limit: 100 });
  }

  execute() {
    return Promise.all([
      activity.translate(),
    ])
      .then(() => {
        super.execute();
      });
  }
};
