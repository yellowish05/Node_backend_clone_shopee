const path = require('path');
const BrandModel = require(path.resolve('src/models/BrandModel'));

module.exports = (req, res) => {
  return BrandModel.updateMany(
    { productCategories: null },
    { productCategories: [] }
  )
    .then(({ modifiedCount }) => {
      console.log(`[Fix][Brand][ProductCategories] fixed ${modifiedCount} brands.`);
      return res.json({
        status: true,
        message: 'success',
        count: modifiedCount,
      });
    })
    .catch(error => res.json({ status: false, message: error.message }));
}
