/* eslint-disable global-require */
/* eslint-disable eqeqeq */

const env = (process.env.NODE_ENV || 'development').trim();
const isDebugMode = (process.env.DEBUG_MODE || '').trim() == '1';

if (env === 'development' || env === 'test') {
  require('dotenv').config({ path: `${__dirname}/../.env` });
}

module.exports = {
  domain: process.env.DOMAIN || 'localhost',
  logs: {
    name: 'api',
    level: isDebugMode ? 'debug' : 'info',
    cloudWatchEnabled: (process.env.LOGS_CLOUD_WATCH || '').trim() == '1' || false,
  },
  env,
  isDebugMode,
  port: 4000,
  corsDomain: process.env.CORS_DOMAIN || '*',
  apolloEngineApiKey: process.env.ENGINE_API_KEY || null,
  mongo: {
    uri: process.env.MONGO_URI,
    migrateUri: env === 'development' ? process.env.MONGO_MIGRATE_URI : process.env.MONGO_URI,
  },
  i18n: {
    defaultLocale: 'EN',
    locales: ['EN'],
  },
  cdn: {
    appAssets: process.env.CDN_APP_ASSETS_DOMAIN,
    media: process.env.CDN_MEDIA_DOMAIN,
    userAssets: process.env.CDN_USER_ASSETS_DOMAIN,
  },
  aws: {
    agora_api_key: process.env.AWS_AGORA_ACCESS_KEY_ID || null,
    agora_api_secret: process.env.AWS_AGORA_SECRET_ACCESS_KEY || null,
    app_bucket: process.env.AWS_APP_BUCKET,
    media_bucket: process.env.AWS_MEDIA_BUCKET,
  },
  google: {
    places_uri: process.env.GOOGLE_PLACES_URI,
    api_key: process.env.GOOGLE_API_KEY || null,
  },
  agora: {
    uri: process.env.AGORA_URI,
    app_id: process.env.AGORA_APP_ID || null,
    app_cert: process.env.AGORA_APP_CERT || null,
    api_key: process.env.AGORA_API_KEY || null,
    api_cert: process.env.AGORA_API_CERT || null,
  },
  assets: {
    types: {
      IMAGE: 'IMAGE',
      VIDEO: 'VIDEO',
      PDF: 'PDF',
    },
  },
  tests: {
    entrypoint: process.env.TEST_ENTRYPOINT || null,
  },
};
