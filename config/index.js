/* eslint-disable global-require */
/* eslint-disable eqeqeq */

const env = (process.env.NODE_ENV || 'development').trim();
const isDebugMode = (process.env.DEBUG_MODE || '').trim() == '1';

if (env === 'development' || env === 'test') {
  require('dotenv').config({ path: `${__dirname}/../.env` });
}

module.exports = {
  domain: 'localhost',
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
    user_bucket: process.env.AWS_USER_ASSETS_BUCKET,
  },
  google: {
    places_uri: 'https://maps.googleapis.com/maps/api/place',
    api_key: process.env.GOOGLE_API_KEY || null,
  },
  facebook: {
    api_uri: 'https://graph.facebook.com',
  },
  agora: {
    uri: 'https://api.agora.io/v1/apps',
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
  verificationCode: {
    TTL: 1800,
  },
  exchangeCurrencyRates: {
    TTL: 10 * 60 * 1000,
  },
  email: {
    from: process.env.ELASTIC_EMAIL_FROM,
    bodyType: 'Plain',
    elasticEmailOptions: {
      apiKey: process.env.ELASTIC_EMAIL_API_KEY,
      apiUri: 'https://api.elasticemail.com/',
      apiVersion: 'v2',
    },
  },
  payment: {
    testMode: (process.env.PAYMENT_TEST_MODE || null) !== 'disabled',
  },
};
