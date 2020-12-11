// HTTP SERVER
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');

const repository = require('./repository');
const { AgoraService } = require('./lib/AgoraService');

const { corsDomain } = require(path.resolve('config'));
const apolloServerFactory = require(path.resolve('src/graphql'));
const { mongoClientCloseConnection } = require(path.resolve('config/mongoConnection'));
const webhookRouters = require('./webhooks');
const viewersRouters = require('./viewers');

const { InvoiceService } = require(path.resolve('src/lib/InvoiceService'));
const { payment: { providers: { stripe } } } = require(path.resolve('config'));
const stripSDK = require('stripe')(stripe.secret);

const { PurchaseOrderStatus } = require(path.resolve('src/lib/Enums'));

var multiparty = require('connect-multiparty');

const multipartymiddleware = multiparty();

const fs = require('fs');

const morgan = require('morgan');
const logger = require('../config/logger');

const pageRouters = require('./pages');
const ApiV1Routers = require('./api_v1');

process.on('SIGINT', () => {
  mongoClientCloseConnection();
});

const app = express();
app.use(express.json({ limit: '50000mb' }));
app.use(express.urlencoded({ limit: '50000mb', extended: true }));
// app.use(morgan('combined', { stream: logger.stream }));

app.get('/health', (req, res) => {
  res.send({ status: 'pass' });
});

app.use('/webhooks', webhookRouters);
app.use('/viewers', viewersRouters);
app.use('/pages', pageRouters);
app.use('/api/v1', ApiV1Routers);

app.route('/upload').post(multipartymiddleware, function (req, res) {
  let file = req.files.file;
  fs.readFile(file.path, function (err, data) {
    AgoraService.upload(data, function (location) {
      res.send(location);
      fs.unlink(file.path, function (err) {
        console.log('Temp File Deleted');
      })
      //AgoraService.publish(location);
    })
  })
})

app.post('/invoice', async (req, res) => {
  const orderDetails = await InvoiceService.getOrderDetails(req.body.pid, req.body.userID);
  const PDFs = [];
  await Promise.all(orderDetails.map(async (orderDetail) => {
    const url = InvoiceService.createInvoicePDF(orderDetail);
    PDFs.push(url);
  }));

  res.status(200).send(PDFs);
});

app.post('/cancel', async (req, res) => {
  const paymentIntent = await stripSDK.paymentIntents.cancel(req.body.pid);
  res.send(JSON.stringify(paymentIntent));
});

app.post('/packing', async (req, res) => {
  const orderDetails = await InvoiceService.getOrderDetails(req.body.pid, req.body.userID);
  const invoicePDF = await InvoiceService.createPackingSlip(orderDetails);
  res.status(200).send(invoicePDF);
});


app.use('/terms_conditions', express.static('terms_conditions'));

app.use(cors({
  origin: corsDomain,
  optionsSuccessStatus: 200,
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-timebase"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});

const apolloApp = express();
const apolloServer = apolloServerFactory({ repository });

apolloServer.applyMiddleware({
  app: apolloApp,
  path: '/',
  cors: corsDomain,
  disableHealthCheck: true,
});

const robots = require('./robots');

robots.startRobots();

app.use('/graphql', apolloApp);

const httpServer = createServer(app);
apolloServer.installSubscriptionHandlers(httpServer);

module.exports.httpServer = httpServer;
