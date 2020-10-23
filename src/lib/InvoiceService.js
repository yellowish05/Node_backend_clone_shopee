const NodeGeocoder = require('node-geocoder');
const path = require('path');
const logger = require(path.resolve('config/logger'));
const { request, gql } = require('graphql-request');
const ReverseMd5 = require('reverse-md5')
const repository = require(path.resolve('src/repository'));
const { payment: { providers: { stripe } } } = require(path.resolve('config'));
const stripe = require("stripe")(payment.providers.stripe.secret);

const reverseMd5 = ReverseMd5()

module.exports.InvoiceService = {
  getOrderDetails(paymentIntentID, userID) {
    const user = await repository.user.getByID(userID)
    const paymentIntent = await stripe.paymentIntents.retrieve(pid)
    const order = await repository.purchaseOrder.getByClientSecret(paymentIntent.client_secret)

    const accesstoken_query = gql`
        mutation {
            generateAccessToken(
            data: {
                email: $email
                password: @password
            }
            )
        }
    `
  }
};
