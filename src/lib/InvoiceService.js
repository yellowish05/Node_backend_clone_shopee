const NodeGeocoder = require('node-geocoder');
const path = require('path');
const logger = require(path.resolve('config/logger'));
const { request, gql } = require('graphql-request');
const repository = require(path.resolve('src/repository'));
const { payment: { providers: { stripe } } } = require(path.resolve('config'));
const provider = require("stripe")(stripe.secret);

module.exports.InvoiceService = {
  async getOrderDetails(paymentIntentID, userID) {
    const orderDetails = {}
    const user = await repository.user.load(userID)
    
    // Object.defineProperties(orderDetails, {
    //   shipping_address: {
    //     value: {

    //     },
    //     writable: fals
    //   }
    // })
    const paymentIntent = await provider.paymentIntents.retrieve(paymentIntentID)
    console.log("Client_Secret: ", paymentIntent.client_secret)
    const order = await repository.purchaseOrder.getByClientSecret(paymentIntent.client_secret)
    console.log("Order: ", order)
    const order_query = gql`
        query getPurchaseOrder($orderID: ID!){
          purchaseOrder (
            id: $orderID
          ) {
            id
            total {
              formatted
            }
            items {
              id
              title
              quantity
              price {
                amount
                currency
                formatted
              }
              total {
                amount
                currency
                formatted
              }
              seller {
                name
              }
              deliveryPrice {
                amount
                currency
                formatted
              }
              deliveryOrder {
                estimatedDeliveryDate
              }
            }
          }
        }
    `
    
    const variables = {
      orderID: order.id
    }

    return request('http://localhost:4000/graphql', order_query, variables)

  }
};
