const path = require('path');
const csv = require('csv-parser');
const fs = require('fs');
const uuid = require('uuid/v4');

require(path.resolve('config/mongoMigrateConnection'));

const logger = require(path.resolve('config/logger'));
const ProductCategoryModel = require('../model/ProductCategoryModel');
const AssetModel = require('../model/AssetModel');
const csvPath = path.resolve('src/migrations/sources/productcategories-China-Xiufu.csv');

const mimeTypes = {
  png: 'image/png',
  jpg: 'image/jpg',
};

async function parseCSVContent() {
  const results = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results));
  })
}


/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  const CDN_PATH = "https://cdn-stage.shoclef.com";

  return parseCSVContent()
    .then(rows => {
      return wImages = rows.filter(row => row.image_url);
    })
    .then(wImages => {
      return Promise.all(wImages.map(row => {
        const newPath = row.image_url.replace(CDN_PATH, '');
        const ext = row.image_url.substr(row.image_url.lastIndexOf('.') + 1);

        return Promise.all([
          ProductCategoryModel.findOne({ _id: row._id }),
          AssetModel.findOne({ _id: row.image }),
          AssetModel.findOne({ path: newPath }),          
        ])
          .then(([category, assetById, assetByPath]) => {

            if (category && assetByPath && category.image === row.image) {
              assetByPath.path = newPath;
              assetByPath.url = row.image_url;
              assetByPath.mimetype = mimeTypes[ext];
              category.image = assetByPath._id;
              return Promise.all([
                assetByPath.save(),
              ]);
            } else if (category && assetById && category.image === row.image) {
              assetById.path = newPath;
              assetById.url = row.image_url;
              assetById.mimetype = mimeTypes[ext];
              return assetById.save();
            } else {

              const assetData = {
                _id: uuid(),
                status: "UPLOADED",
                owner: "a0f952da-815b-43d8-ba9f-4c3348b758f7",
                path: newPath,
                url: row.image_url,
                type: "IMAGE",
                size: 1000,
                mimetype: mimeTypes[ext] || 'image/jpg',
              };
              return AssetModel.create(assetData)
            }
          })
      }));
    })
    .then((rows) => {
      logger.info(`[MIGRATE] updated ${rows.length} Asset documents to Mongo!`);
    })
    .catch((error) => {
      logger.error(error.message);
      throw error;
    });
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () {
  // Write migration here

}

up()
  .then(() => {
    logger.info('test')
  })

module.exports = { up, down };
