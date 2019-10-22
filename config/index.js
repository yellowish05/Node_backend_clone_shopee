const env = process.env.NODE_ENV.trim() || 'development';

if (env === 'development') {
  require('dotenv').config({ path: `${__dirname}/../.env` });
}

module.exports = {
  domain: process.env.DOMAIN || 'localhost',
  logs: {
    name: 'api',
    level: process.env.LOGS_DEBUG_MODE.trim() == '1' ? 'debug' : 'info',
    cloudWatchEnabled: process.env.LOGS_CLOUD_WATCH.trim() == '1' || false,
  },
  env,
  port: 4000,
  corsDomain: process.env.CORS_DOMAIN || '*',
  apolloEngineApiKey: process.env.ENGINE_API_KEY || null,
  mongo: {
    uri: process.env.MONGO_URI,
  },
  i18n: {
    defaultLocale: 'EN',
    locales: ['EN'],
  },
  cdn: {
    url: process.env.CDN_URL,
  },
  assets: {
    types: {
      IMAGE: 'IMAGE',
      VIDEO: 'VIDEO',
      PDF: 'PDF',
    },
  },
};
