/**
 * This router is for dev only. not for the front-end developer!!!
 */
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const { listLanguageCodes, getLanguageName } = require('language-cultures');
const CountryLanguage = require('country-language');
const languages = CountryLanguage.getLanguages();
const { Translate } = require('@google-cloud/translate').v2;
const md5 = require('md5');
const { connect } = require('getstream');

const { chat: { getstream } } = require(path.resolve('config/index'));
const client = connect(getstream.api_key, getstream.api_secret);


const projectId = 'streambliss-test-enviornment';
const translate = new Translate({ projectId });
const repository = require(path.resolve('src/repository'));
const { convertLangCode3to2 } = require(path.resolve('src/lib/LangService'));
const { AssetService } = require(path.resolve('src/lib/AssetService'));
const ProductService = require(path.resolve('src/lib/ProductService'));


const tempRouter = express.Router();

// language list in language culture mode(en-US)
tempRouter.route('/lang-culture').get(async (req, res) => {
	res.json(listLanguageCodes());
})

// language list in iso639
tempRouter.route('/lang-2').get(async (req, res) => {
	res.json(languages);
})

// language list supported by Google cloud translation API
tempRouter.route('/lang-google').get(async (req, res) => {
	const [langs] = await translate.getLanguages();
	res.json(langs);
})

// update user settings.language: from iso639-3 => iso639-1
tempRouter.route('/update-user-lang').get(async (req, res) => {
	repository.user.loadAll()
		.then(users => users.filter(user => user._id))
		.then(users => Promise.all(users.map(user => repository.user.updateLangSetting(user._id, convertLangCode3to2(user.settings.language || 'ENG')))))
		.then(updates => res.json({ status: true, message: 'All user langs has been updated!' }))
		.catch(error => res.json({ status: false, message: 'Failed to update user langs' }));
});

tempRouter.route('/gen-password').post(async (req, res) => {
  return res.json({
    encrypt: md5(req.body.password)
  })
});

tempRouter.route('/decode-token').post(async (req, res) => {
  const data = jwt.decode(req.body.token);
  return res.json(data);
})

tempRouter.route('/update-stream-thumbnail').get(async (req, res) => {
  let total = 0;
  return Promise.all([
    repository.liveStream.getAll(),
    repository.asset.getAll(),
  ])
    .then(([liveStreams, assets]) => {
      let assetObj = {};
      assets.forEach(asset => {
        assetObj[asset._id.toString()] = asset;
      });

      return Promise.all(liveStreams.map(async liveStream => {
        let assetId;
        if (liveStream.thumbnail) {
          const thumbnail = assetObj[liveStream.thumbnail];
          if (thumbnail &&  (
            !thumbnail.resolution ||
            (thumbnail.resolution.width && thumbnail.resolution.width > 500))) {
            // await AssetService.resizeImage({ assetId: args.data.thumbnail, width: 500 });
            assetId = liveStream.thumbnail;
          }
        } else {
          if (typeof liveStream.preview === 'string') {
            assetId = liveStream.preview;
          } else {
            assetId = liveStream.preview[0];
          }
        }

        if (assetId) {
          console.log('[Converting]', assetId);
          total ++;
          await AssetService.resizeImage({ assetId, width: 500 });
          liveStream.thumbnail = assetId;
          await liveStream.save();
        }
      }))
    })
    .then(() => {
      return res.json({
        status: true, message: "success",
      })
    })
})

tempRouter.route('/getstream-test').get(async (req, res) => {
  try {
    res.json({
      status: true,
      message: client.createUserToken('50202f78-99e8-41b4-b7b3-258728aa7350'),
    })
  } catch (error ) {
    res.json({ 
      status: false,
      message: error.message,
    })
  }
});

tempRouter.route('/brand-cate-by-tags').post(async (req, res) => {
  return repository.brandCategory.getByIdsAndTags(req.body.ids, req.body.hashtags)
    .then(result => res.json(result));
});

tempRouter.route('/brand-by-tags').post(async (req, res) => {
  return repository.brand.getByCategoryAndTags(req.body.ids, req.body.hashtags)
    .then(result => res.json(result));
});

tempRouter.route('/analyze-theme').post(async (req, res) => {
  const { id: themeId } = req.body;
  return ProductService.analyzeTheme(themeId)
    .then(result => res.json(result));
});

tempRouter.route('/fix-seller').post(async (req, res) => {
  const newSeller = req.body.seller;
  return repository.product.get({ 
    filter: {},
    sort: { feature: 'CREATED_AT', type: 'ASC' },
    page: {
      limit: req.body.limit,
      skip: req.body.skip,
    }, 
  })
    .then(async products => {
      let changed = [];
      let errors = [];
      await Promise.all(products.map(async (product, i) => {
        const sellerId = product.seller;
        const seller = await repository.user.getById(product.seller);
        if (!seller) {
          product.seller = newSeller;
          product.oldPrice = product.oldPrice || product.discountPrice || product.price;
          try {
            product.save();
            changed.push({ id: product._id, seller: sellerId });
          } catch(e) {
            errors.push({ product: product._id, error: e.message });
          }
        }
        if (i % 100 === 0) console.log('Working on ', i);
      }))
      return { changed, errors };
    })
    .then(updaetedProducts => res.json(updaetedProducts));
});

tempRouter.route('/delete-products').delete(async (req, res) => {
  return repository.product.deleteMany()
    .then(result => res.json(result));
})

module.exports = tempRouter;
