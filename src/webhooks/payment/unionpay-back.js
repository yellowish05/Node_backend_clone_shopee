const path = require('path');

const logger = require(path.resolve('config/logger'));

module.exports = async (req, res) => {
  console.log('[UnionPay][BackURL]', req.body)
  const { body, headers } = req;
  logger.debug(JSON.stringify(headers));
  logger.debug(JSON.stringify(body));
  return res.status(200);
}


