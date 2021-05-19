
const path = require('path');
const { slugify } = require('transliteration');

const repository = require(path.resolve('src/repository'));

const activity = {
  processBatch: (skip, limit) => {
    return repository.product.get({
      filter: {},
      sort: { title: 1 },
      page: { skip, limit },
    }).then((products) => Promise.all(products.map((product) => {
      return repository.product.model.find({ title: product.title, _id: { $ne: product._id } })
        .then((productsWithSameTitle) => {
          if (productsWithSameTitle.length > 0) {
            product.slug = slugify(product.title) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          } else {
            product.slug = slugify(product.title);
          }
          return product.save();
        })
    })));
  },
}

module.exports = async (req, res) => {
  const batch = 200;
  return repository.product.getTotal({}).then(async (total) => {
    const nIter = Math.ceil(total / batch);
    for (let i = 0; i < nIter; i++) {
      await activity.processBatch(i * batch, batch)
        .catch((e) => {
          console.log(`[Batch][${i * batch}-${(i + 1) * batch}]`, e);
        });
    }

    return res.json({ status: true, total });
  })
  .catch((e) => res.json({ status: false, message: e.message }));
}
