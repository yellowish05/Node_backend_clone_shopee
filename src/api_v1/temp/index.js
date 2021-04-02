/**
 * This router is for dev only. not for the front-end developer!!!
 */
const express = require('express');
const app = express();
const fs = require('fs');
const os = require('os');
const path = require('path');
const jwt = require('jsonwebtoken');
const uuid = require("uuid/v4");
const { request, GraphQLClient, gql } = require('graphql-request');

const { listLanguageCodes, getLanguageName } = require('language-cultures');
const CountryLanguage = require('country-language');
const languages = CountryLanguage.getLanguages();
const { Translate } = require('@google-cloud/translate').v2;
const md5 = require('md5');
const csv = require('csv-parser');
var formidable = require('formidable');
// const LanguageDetect = require('languagedetect');

const { transliterate: tr, slugify } = require('transliteration');

const { protocol, domain } = require(path.resolve('config/index'));

const projectId = 'streambliss-test-enviornment';
const translate = new Translate({ projectId });
const repository = require(path.resolve('src/repository'));
const { convertLangCode3to2, convertLangCode2to3 } = require(path.resolve('src/lib/LangService'));
const { AssetService } = require(path.resolve('src/lib/AssetService'));
const ProductService = require(path.resolve('src/lib/ProductService'));
const streamService = require(path.resolve('src/lib/StreamService'));
const PythonService = require(path.resolve('src/lib/PythonService'));
const { StreamChannelStatus } = require(path.resolve('src/lib/Enums'));
const translateProducts = require('./resolvers/translateProducts');


// const DETECT_LANG_KEY = "aa2719f224cb4eff10710a7dce3c0dd8";

const parseCSVContent = (readStream) => {
  const results = [];
  return new Promise((resolve, reject) => {
    readStream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results);
      });
  })
}

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
		.catch(error => {
      console.log('[Lang][Update] error', error)
      return res.json({ status: false, message: 'Failed to update user langs' })
    });
});

tempRouter.route('/gen-password').post(async (req, res) => {
  return res.json({
    encrypt: md5(req.body.password)
  })
});

tempRouter.route('/get-domain').get(async (req, res) => {
  res.json({
    domain: `${protocol}://${domain}`,
  })
})

tempRouter.route('/decode-token').post(async (req, res) => {
  const data = jwt.decode(req.body.token);
  return res.json(data);
})

tempRouter.route('/resize-asset').post(async (req, res) => {
  const { id: assetId } = req.body;
  AssetService.resizeImage({ assetId, width: 300 })
    .then(asset => res.json(asset))
    .catch(error => {
      console.log('[Resize Img]', error);
      res.json({ status: false, message: error.message })
    })
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
    sort: { feature: 'TITLE', type: 'ASC' },
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

tempRouter.route('/slugify').post(async (req, res) => {
  const src = req.body.source;

  // console.log('[translate]', transliterate(src));
  // slugify.config({ replace: [['_', '-'], ['_', '-'], [' ', '-']] })
  return res.json({
    src,
    slug: slugify(src),
    trans: tr(src),
    // slug: slugify(src, {
    //   // replacement: '-_ '
    //   // replace: [['_', '-'], ['_', '-'], [' ', '-']],
    //   emoji: true,
    //   separator: '-',
    // })
  })
})

tempRouter.route('/product-slugify').post(async (req, res) => {
  const { skip, limit } = req.body;
  // console.log('[test]', req.body.test, skip, limit);

  // const categories = await repository.productCategory.getUnderParents(["b719fa50-07c8-41b5-8683-912967862357"]);

  return repository.product.get({
    filter: { },
    sort: { feature: 'TITLE', type: 'ASC' },
    page: { skip, limit },
  })
    .then(async products => {
      let changes = [];
      let errors = [];
      await Promise.all(products.map(async (product, i) => {
        let slug = slugify(product.title);
        const productsBySlug = await repository.product.getAll({ title: product.title });
        const others = productsBySlug.filter(item => item._id !== product._id);
        // console.log('[others]', others.length, others.map(item => ({ id: item._id, slug: item.slug })));
        if (others.length) {
          const rand = Math.floor(Math.random() * 1000);
          slug += `-${rand.toString().padStart(3, '0')}`;
        }
        product.slug = slug;
        if ((i + 1) % 100 === 0) {
          console.log('[cursor at]', i + 1);
        }

        try {
          changes.push({
            product: product._id,
          })
          product.oldPrice = product.oldPrice || product.discountPrice || product.price;
          return product.save();
        } catch(e) {
          errors.push({
            product: product._id,
            error: e.message          
          });
        }
      }));
      return { changes, errors };
    })
    .then(({ changes, errors }) => {
      return res.json({
        changes: changes.length,
        errors,
      })
    })
});

tempRouter.route('/tests').get(async (req, res) => {
  const word = '卧室水晶吸顶灯北欧风格客厅轻奢灯具美式现代简约大气餐厅家用灯';
  const slug = slugify(word); //console.log(slug);
  res.send(slug);
});

tempRouter.route('/generateSlug').post(async (req, res) => {
  const { id, slug, title } = req.body;
  return ProductService.generateSlug({ id, slug, title })
    .then(slug => res.json({ slug }));
});

tempRouter.route('/product-category-slugify').post(async (req ,res) => {
  return repository.productCategory.getAll()
    .then(async productCategories => {
      let changes = [];
      let errors = [];
      let total = productCategories.length;
      await Promise.all(productCategories.map(async (category, i) => {
        let slug = slugify(category.name);
        const categoryBySlug = await repository.productCategory.getAll({ name: category.name });
        const otherCategories = categoryBySlug.filter(item => item._id !== category._id);

        if (otherCategories.length > 0) {
          const rand = Math.floor(Math.random() * 1000);
          slug += `-${rand.toString().padStart(3, '0')}`;
        }
        if ((i + 1) % 100 === 0) {
          console.log('[cursor at]', i + 1);
        }

        try {
          changes.push(category._id);
          category.slug = slug;
          return category.save();
        } catch (e) {
          console.log(e);
          errors.push({
            category: category._id,
            error: e.message,
          });
          throw e;
        }
      }));
      return { changes, errors, total };
    })
      .then(({ changes, errors, total }) => {
        return res.json({ total, changes, errors });
      })
      .catch(e => {
        console.log(e);
        return res.send(e.message);
      })
      ;
})

tempRouter.route('/live-category-slugify').post(async (req, res) => {
  return repository.liveStreamCategory.getAll()
    .then(async productCategories => {
      let changes = [];
      let errors = [];
      let total = productCategories.length;
      await Promise.all(productCategories.map(async (category, i) => {
        let slug = slugify(category.name);
        const categoryBySlug = await repository.liveStreamCategory.getAll({ name: name });
        const otherCategories = categoryBySlug.filter(item => item._id !== category._id);

        if (otherCategories.length > 0) {
          const rand = Math.floor(Math.random() * 1000);
          slug += `-${rand.toString().padStart(3, '0')}`;
        }
        if ((i + 1) % 100 === 0) {
          console.log('[cursor at]', i + 1);
        }


        try {
          changes.push(category._id);
          category.slug = slug;
          return category.save();
        } catch (e) {
          console.log(e);
          errors.push({
            category: category._id,
            error: e.message,
          });
          throw e;
        }
      }));
      return { changes, errors, total };
    })
      .then(({ changes, errors, total }) => {
        return res.json({ total, changes, errors });
      })
      .catch(e => {
        console.log(e);
        return res.send(e.message);
      })
      ;
});

tempRouter.route('/livestream-slugify').post(async (req, res) => {
  return repository.liveStream.getAll()
    .then(async productCategories => {
      let changes = [];
      let errors = [];
      let total = productCategories.length;
      await Promise.all(productCategories.map(async (category, i) => {
        let slug = slugify(category.title);
        const categoryBySlug = await repository.liveStream.getAll({ title: category.title });
        const otherCategories = categoryBySlug.filter(item => item._id !== category._id);

        if (otherCategories.length > 0) {
          const rand = Math.floor(Math.random() * 1000);
          slug += `-${rand.toString().padStart(3, '0')}`;
        }
        if ((i + 1) % 100 === 0) {
          console.log('[cursor at]', i + 1);
        }


        try {
          changes.push(category._id);
          let n1, n2;
          category.slug = slug; n1 = category.categories.length; //console.log('[Before], length=', n1 = category.categories.length)
          category.categories = category.categories.filter(id => typeof id === 'string');
          n2 = category.categories.length;
          if (n1 > n2) console.log('[After] length', n2 = category.categories.length, n1 !== n2 ? `${n1} -> ${n2}` : '', category.categories);
          return await category.save();
        } catch (e) {
          console.log(e);
          errors.push({
            category: category._id,
            error: e.message,
          });
          throw e;
        }
      }));
      return { changes, errors, total };
    })
      .then(({ changes, errors, total }) => {
        return res.json({ total, changes, errors });
      })
      .catch(e => {
        console.log(e);
        return res.send(e.message);
      })
      ;
});

tempRouter.route('/upload-stream-category').post(async (req, res) => {
  const form = new formidable.IncomingForm();
  // path.join(os.tmpdir(), tmpFileName)
  form.uploadDir = os.tmpdir();
  form.keepExtensions = true;

  form.parse(req, async function(err, fields, files) {
    // res.writeHead(200, { 'content-type': 'text/plain' });
    // res.write('received upload: \n\n');

    console.log('form.bytesReceived');
    //TESTING
    console.log("file size: "+JSON.stringify(files.file.size));
    console.log("file path: "+JSON.stringify(files.file.path));
    console.log("file name: "+JSON.stringify(files.file.name));
    console.log("file type: "+JSON.stringify(files.file.type));

    fs.rename(files.file.path, path.join(os.tmpdir(), files.file.name), async function(err) {
      if (err) throw err;
      console.log('renamed complete');

      const fileStream = fs.createReadStream(path.join(os.tmpdir(), files.file.name));
      const csvContent = await parseCSVContent(fileStream);
      return res.json(csvContent);
    });
  })
})

tempRouter.route('/include-name-to-product-cateogry-hashtags').post(async (req, res) => {
  return repository.productCategory.getAll()
    .then(categories => {
      let result = {
        added: 0,
        total: 0,
      };
      result.total = categories.length;
      return Promise.all(categories.map(category => {
        let hashtags = category.hashtags;
        if (!hashtags.includes(category.name)) {
          hashtags.push(category.name);
          category.hashtags = hashtags;
          result.added ++;
        }
      }))
      .then(() => result);
    })
    .then(result => res.json(result));
})

tempRouter.route('/update-stream-status').post(async (req, res) => {
  return repository.liveStream.getAll({ status: 'CANCELED' })
    .then(streams => Promise.all(streams.map(stream => {
      return repository.streamChannel.load(stream.channel)
        .then(streamChannel => {
          if (stream.status === streamChannel.status) return [stream, streamChannel];
          const statuses = [stream.status, streamChannel.status].filter(status => status !== StreamChannelStatus.CANCELED);
          return streamService.updateStreamStatus(stream, statuses.length > 0 ? statuses[0] : StreamChannelStatus.CANCELED);
        })
        .then(([stream]) => stream.status)
        .catch((e) => e.message);
    })))
    .then(statuses => res.json(statuses));
})

tempRouter.route('/detect-lang').post(async (req, res) => {
  return PythonService.detectLanguage(req.body.text)
    .then(lang => res.json({ lang }))
})

const loopCorrectInventoryLog = async ({ skip, limit, auth }) => {
  const query = gql`
  mutation correctProductInventoryLog($skip: Int!, $limit: Int!){
    correctProductInventoryLog(skip: $skip, limit: $limit) {
      totalProducts
      processed
      success
      failure
      errors{
        id
        errors
      }
    }
  }`;

  const endpoint = 'http://localhost:4000/graphql';
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: auth,
    }
  });

  return graphQLClient.request(query, { skip, limit })
    .then(({ correctProductInventoryLog: data }) => {
      if (data && data.processed < data.totalProducts) {
        return loopCorrectInventoryLog({ skip: skip + limit, limit, auth });
      } else {
        return data;
      }
    })
}

tempRouter.route('/correct-inventory-log').post(async (req, res) => {
  return loopCorrectInventoryLog({ ...req.body, auth: req.headers.authorization})
    .then(data => res.json(data))
    .catch(error => res.json({ status: false, message: error.message }));
})

const loopUpdateProductHashtags = async ({ skip, limit, auth }) => {
  const query = gql`
  mutation updateProductHashtags($skip: Int!, $limit: Int!){
    updateProductHashtags(skip: $skip, limit: $limit) {
      totalProducts
      processed
      success
      failure
      errors{
        id
        errors
      }
    }
  }`;

  const endpoint = 'http://localhost:4000/graphql';
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: auth,
    }
  });

  return graphQLClient.request(query, { skip, limit })
    .then(({ updateProductHashtags: data }) => {
      if (data && data.processed < data.totalProducts) {
        return loopUpdateProductHashtags({ skip: skip + limit, limit, auth });
      } else {
        return data;
      }
    })
}

tempRouter.route('/update-product-hashtags').post(async (req, res) => {
  return loopUpdateProductHashtags({ ...req.body, auth: req.headers.authorization})
    .then(data => res.json(data))
    .catch(error => res.json({ status: false, message: error.message }));
})

tempRouter.route('/trans/google').post(async (req, res) => {
  const { text, dest } = req.body;
  return PythonService.googletrans(text, dest)
    .then((resp) => res.json(resp))
});

tempRouter.route('/translat-from-csv').post(async (req, res) => {
  const form = new formidable.IncomingForm();
  // path.join(os.tmpdir(), tmpFileName)
  form.uploadDir = os.tmpdir();
  form.keepExtensions = true;

  form.parse(req, async function(err, fields, files) {
    // res.writeHead(200, { 'content-type': 'text/plain' });
    // res.write('received upload: \n\n');

    console.log('form.bytesReceived');
    //TESTING
    console.log("file size: "+JSON.stringify(files.file.size));
    console.log("file path: "+JSON.stringify(files.file.path));
    console.log("file name: "+JSON.stringify(files.file.name));
    console.log("file type: "+JSON.stringify(files.file.type));

    fs.rename(files.file.path, path.join(os.tmpdir(), files.file.name), async function(err) {
      if (err) throw err;
      console.log('renamed complete');

      const fileStream = fs.createReadStream(path.join(os.tmpdir(), files.file.name));
      const csvContent = await parseCSVContent(fileStream);
      
      await translateProducts(csvContent);

      return res.json(csvContent);
    });
  })
});

module.exports = tempRouter;
