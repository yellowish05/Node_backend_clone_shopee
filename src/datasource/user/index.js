const mongoose = require('mongoose');
const config = require('../../../config');
const logger= require('../../../config/logger');

module.exports.mongoClientCloseConnection = () => {
  mongoose.connection.close(() => {
    logger.info('Mongoose default connection is disconnected due to application termination');
  });
};

module.exports.mongoClientConnection = mongoose.connect(config.user.mongo.url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  reconnectTries: 10,
  reconnectInterval: 100,
}, (error) => {
  if (error === null) {
    logger.info('Mongo connection established Successful!');
  } else {
    logger.error(`Mongo connection failed. Log: ${JSON.stringify(error)}`);
  }
});
