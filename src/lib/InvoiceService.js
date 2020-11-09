const uuid = require('uuid/v4');
const path = require('path');

const { baseURL } = require(path.resolve('config'));
const { request, gql } = require('graphql-request');

const repository = require(path.resolve('src/repository'));
const { payment: { providers: { stripe } } } = require(path.resolve('config'));
const provider = require('stripe')(stripe.secret);

const invoiceTemplate = require(path.resolve('src/view/invoiceTemplate'));
const packingTemplate = require(path.resolve('src/view/packingTemplate'));

const AWS = require('aws-sdk');

const { aws, cdn } = require(path.resolve('config'));
const s3 = new AWS.S3();

module.exports.InvoiceService = {
  async getOrderDetails(orderID) {
    const paymentIntent = await provider.paymentIntents.retrieve(paymentIntentID);

    const orderQuery = gql`
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
            buyer {
              id
              email
              name
              phone
              address {
                street
                city
                region {
                  name
                }
                country {
                  name
                }
              }
            }
            createdAt
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
    `;

    const variables = {
      orderID,
    };

    const itemsDetail = await request(`${baseURL}graphql`, orderQuery, variables);
    const items = [];
    const user = itemsDetail.purchaseOrder.buyer;
    const orderDate = itemsDetail.purchaseOrder.createdAt;


    await Promise.all(itemsDetail.purchaseOrder.items.map(async (item) => {
      const orderItem = await repository.orderItem.getById(item.id);
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
          ID: orderItem.product,
        });
      const image = product.product.assets.length > 0 ? product.product.assets[0].url : '';
      items.push({ ...item, image });
    }));

    const orderDetails = {
      orderDate,
      orderID,
      shipping_address: {
        client_name: user.name,
        street: user.address.street,
        city: user.address.city,
        state: user.address.region,
        country: user.address.country,
        phone: user.phone,
        email: user.email,
      },
      payment_info: {
        payment_method: {
          type: paymentIntent.charges.data[0].payment_method_details.type,
          details: paymentIntent.charges.data[0].payment_method_details.type == 'card' ? paymentIntent.charges.data[0].payment_method_details.card : null,
        },
        billing_address: {
          ...paymentIntent.charges.data[0].billing_details.address,
          name: paymentIntent.charges.data[0].billing_details.name,
          email: paymentIntent.charges.data[0].billing_details.email,
          phone: paymentIntent.charges.data[0].billing_details.phone,
        },
      },
      items,
      price_summary: {
        items: itemsDetail.purchaseOrder.price,
        shipping: itemsDetail.purchaseOrder.deliveryPrice,
        before_tax: itemsDetail.purchaseOrder.total,
        tax: '$0.00',
        total: itemsDetail.purchaseOrder.total,
      },
    };

    return orderDetails;
  },

  async createInvoicePDF(orderDetails) {
    const html = await invoiceTemplate(orderDetails);
    const id = uuid();
    const key = `invoicepdf/${id}.pdf`;
    await Promise.all([s3.putObject({
      Bucket: aws.app_bucket,
      Key: key,
      Body: html,
    }).promise(),
    repository.purchaseOrder.addInovicePDF(orderDetails.orderID, `${cdn.appAssets}/${key}`),
    ])
      .then(() => `${cdn.appAssets}/${key}`)
      .catch((error) => {
        throw new Error(error);
      });
    return `${cdn.appAssets}/${key}`;
  },

  async createPackingSlip(orderDetails) {
    const html = await packingTemplate(orderDetails);
    const id = uuid();
    const key = `packingSlip/${id}.pdf`;
    await Promise.all([s3.putObject({
      Bucket: aws.app_bucket,
      Key: key,
      Body: html,
    }).promise(),
    // repository.purchaseOrder.addPackingSlip(orderDetails.orderID, `${cdn.appAssets}/${key}`),
    ])
      .then(() => `${cdn.appAssets}/${key}`)
      .catch((error) => {
        throw new Error(error);
      });
    return `${cdn.appAssets}/${key}`;
  },
  async getSalesOrderDetails(orderID) {
    return orderID;
  },
};
