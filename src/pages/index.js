const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const path = require('path');
// const repository = require(path.resolve('src/repository'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/paypal/success', (req, res) => {
    res.render('paypal-success');
});
app.get('/paypal/cancel', (req, res) => {
    res.render('paypal-cancel');
});
app.get('/socket/client', (req, res) => {
    res.render('socket-client');
});

module.exports = app;
