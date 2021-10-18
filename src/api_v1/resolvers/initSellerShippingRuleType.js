const OrganizationModel = require('../../model/OrganizationModel');
const { ShippingRuleType } = require('../../lib/Enums');

module.exports = (req, res) => {
  return OrganizationModel.updateMany({}, { shippingRule: ShippingRuleType.SIMPLE })
    .then(({ n, nModified }) => res.json({ status: true, message: 'success', n,  }))
    .catch(error => res.json({ status: false, message: error.message }));
}
