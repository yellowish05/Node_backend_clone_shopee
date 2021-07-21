const express = require('express');
const bodyParser = require('body-parser');
const morganBody = require('morgan-body');
const path = require('path');
const logger = require('../../config/logger');

const translationRouters = require('./translation');
const tempRouters = require('./temp');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

morganBody(app, { stream: logger.stream, noColors: true, prettify: false });

app.use('/translation', translationRouters);
app.use('/temp', tempRouters); // this is for test and transform only

app.route('/sync').post((req, res) => require('./resolvers/syncTables')(req, res));
app.route('/sync-with-slug').post((req, res) => require('./resolvers/syncTablesWithSlug')(req, res));
app.route('/sync-with-default').post((req, res) => require('./resolvers/syncWithDefault')(req, res));
app.route('/delete/:table').delete((req, res) => require('./resolvers/deleteAllTable')(req, res));
app.route('/update-product-slug').post((req, res) => require('./resolvers/updateProductSlug')(req, res));
app.route('/update-stream-slug').post((req, res) => require('./resolvers/updateStreamSlug')(req, res));
app.route('/product-category-slug').patch((req, res) => require('./resolvers/updateProductCategorySlug')(req, res));

// Translations
app.route('/translate-brands').post((req, res) => require('./resolvers/translateBrands')(req, res));


module.exports = app;
