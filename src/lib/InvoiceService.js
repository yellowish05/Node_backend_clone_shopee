const uuid = require('uuid/v4');
const path = require('path');
const { baseURL } = require(path.resolve('config'));
const { request, gql } = require('graphql-request');
const repository = require(path.resolve('src/repository'));
const { payment: { providers: { stripe } } } = require(path.resolve('config'));
const provider = require("stripe")(stripe.secret);
const invoiceTemplate = require(path.resolve('src/view/invoiceTemplate'));
const AWS = require('aws-sdk');
const { aws, cdn } = require(path.resolve('config'));
const s3 = new AWS.S3();

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

    const items_detail = await request(`${baseURL}graphql`, order_query, variables)
    let items = []
    await Promise.all(items_detail.purchaseOrder.items.map( async (item) => {
      const orderItem = await repository.orderItem.getById(item.id)
      const product = await request(`${baseURL}graphql`, 
        gql`
        query getProduct($ID: ID!){
          product (
            id: $ID
          ) {
            id
            assets {
              id
              url
            }
          }
        }`, 
        {
          ID: orderItem.product
        }
      )
      const image = product.product.assets.length > 0 ? product.product.assets[0].url : ''
      items.push({...item, image})
    }))

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
      items,
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
    const html = await invoiceTemplate(orderDetails)
    console.log("Invoice PDF: ", html)
    const id = uuid();
    const path = `invoicepdf/${id}.pdf`;
    await Promise.all([s3.putObject({
      Bucket: aws.user_bucket,
      Key: path,
      Body: html,
    }).promise()])
    .then((url) => {
      console.log("upload link: ", url)
    })
    .catch((error) => {
      throw new Error(error);
    });
    return html
  }
};
