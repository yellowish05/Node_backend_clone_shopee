const path = require('path');
const logger = require(path.resolve('config/logger'));
const { LanguageList } = require(path.resolve('src/lib/Enums'));
const repository = require(path.resolve('src/repository'));
const { translate_ggl: translate } = require(path.resolve('src/lib/TranslateService'));

const activity = {
  processBatch: async (products, repository) => {
    const languageList = LanguageList.toList();
    return Promise.all(products.map(async (product) => {
      const { _id } = product;
      const title = {};
      const description = {};
      const translatedProduct = await repository.productTranslation.getByProduct(_id);
      if (!translatedProduct) {
        await Promise.all(languageList.map(async (language) => {
          const tt = await translate(language.toLowerCase(), product.title);
          const dd = await translate(language.toLowerCase(), product.description);

          title[language.toLowerCase()] = tt || product.title;
          description[language.toLowerCase()] = dd || product.description;
        }));

        await repository.productTranslation.addNewProduct({ product: _id, title, description });
        await activity.sleep(3000);
      }
    }));
  },
  sleep: async (ms) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true);
      }, ms);
    })
  },
}

module.exports = async (products) => {
  console.log('[Translation][Products][Count]', products.length);
  const batch = 2;
  const iterN = Math.ceil(products.length / batch);
  for (let i = 0; i < iterN; i ++) {
    await activity.processBatch(products.slice(i * batch, (i + 1) * batch), repository);
    logger.info(`[Translate] [${i * batch}-${(i + 1) * batch}] Done`);
  }
  console.log(`[Translation] ${products.length} products finished!`);
}
