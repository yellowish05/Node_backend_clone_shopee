const NodeGeocoder = require('node-geocoder');
const path = require('path');
const logger = require(path.resolve('config/logger'));
const { request, gql } = require('graphql-request');
const repository = require(path.resolve('src/repository'));
const { payment: { providers: { stripe } } } = require(path.resolve('config'));
const provider = require("stripe")(stripe.secret);

module.exports.InvoiceService = {
  async getOrderDetails(paymentIntentID, userID) {
    const user = await repository.user.load(userID)
    const paymentIntent = await provider.paymentIntents.retrieve(paymentIntentID)
    const orderDate = new Date(paymentIntent.created * 1000).toDateString()
    const order = await repository.purchaseOrder.getByClientSecret(paymentIntent.client_secret)
    const order_query = gql`
        query getPurchaseOrder($orderID: ID!){
          purchaseOrder (
            id: $orderID
          ) {
            id
            total {
              amount
              currency
              formatted
            }
            price {
              amount
              currency
              formatted
            }
            deliveryPrice {
              amount
              currency
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

    const items_detail = await request('http://localhost:4000/graphql', order_query, variables)

    const orderDetails = {
      orderDate,
      orderID: order.id,
      shipping_address: {
        client_name: user.name,
        street: user.address.street,
        city: user.address.city,
        state: user.address.region,
        country: user.address.country
      },
      payment_info: {
        payment_method: {
          type: paymentIntent.charges.data[0].payment_method_details.type,
          details: paymentIntent.charges.data[0].payment_method_details.type == 'card' ? paymentIntent.charges.data[0].payment_method_details.card : null
        },
        billing_address: paymentIntent.charges.data[0].billing_details.address
      },
      items: items_detail.purchaseOrder.items,
      price_summary: {
        items: items_detail.purchaseOrder.price,
        shipping: items_detail.purchaseOrder.deliveryPrice,
        before_tax: items_detail.purchaseOrder.total,
        tax: '$0.00',
        total: items_detail.purchaseOrder.total
      }
    }

    return orderDetails

  },

  async createInvoicePDF(orderDetails) {

  }
};
