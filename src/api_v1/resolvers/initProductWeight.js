const ProductModel = require('../../model/ProductModel');
const { WeightUnitSystem } = require('../../lib/Enums');

module.exports = (req, res) => {
  return ProductModel.updateMany({}, { weight: { value: 1, unit: WeightUnitSystem.POUND } })
    .then(({ n, nModified }) => res.json({ status: true, message: 'success', n,  }))
    .catch(error => res.json({ status: false, message: error.message }));
}
