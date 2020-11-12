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
    // const paymentIntent = await provider.paymentIntents.retrieve(paymentIntentID);

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
            paymentInfo
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
                deliveryAddress {
                  id
                  city
                  street 
                  region {
                    id
                    name
                  }
                  country {
                    id
                    name
                  }
                }
              }
              billingAddress {
                id
                city
                street 
                region {
                  id
                  name
                }
                country {
                  id
                  name
                }
              }
            }
          }
        }
    `;

    const variables = {
      orderID,
    };

    const itemsDetail = await request(`${baseURL}graphql`, orderQuery, variables);
    const user = itemsDetail.purchaseOrder.buyer;
    const orderDate = itemsDetail.purchaseOrder.createdAt;
    let items = [];
    let shippingAddress = { id: '' };
    let billingAddress = { id: '' };
    const orderDetails = [];
    const newOrder = {
      orderDate,
      orderID,
      price_summary: {
        items: itemsDetail.purchaseOrder.price,
        tax: '$0.00',
        shipping: itemsDetail.purchaseOrder.deliveryPrice,
        total: itemsDetail.purchaseOrder.total,
      },
    };


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

      if (shippingAddress.id !== item.deliveryOrder.deliveryAddress.id
         || billingAddress.id !== item.billingAddress.id) {
        if (items.length > 0) {
          orderDetails.push({
            ...newOrder,
            shipping_address: {
              client_name: user.name,
              street: shippingAddress.street,
              city: shippingAddress.city,
              state: shippingAddress.name,
              country: shippingAddress.name,
              phone: user.phone,
              email: user.email,
            },
            payment_info: {
              payment_method: itemsDetail.purchaseOrder.paymentInfo,
              billing_address: {
                name: user.name,
                street: billingAddress.street,
                city: billingAddress.city,
                state: billingAddress.region.name,
                country: billingAddress.country.name,
                phone: user.phone,
                email: user.email,
              },
            },
            items,
          });
        }

        shippingAddress = item.deliveryOrder.deliveryAddress;
        billingAddress = item.billingAddress;
        items = [{ ...item, image }];
      } else {
        items.push({ ...item, image });
      }
    }));

    orderDetails.push({
      ...newOrder,
      shipping_address: {
        client_name: user.name,
        street: shippingAddress.street,
        city: shippingAddress.city,
        state: shippingAddress.region.name,
        country: shippingAddress.country.name,
        phone: user.phone,
        email: user.email,
      },
      payment_info: {
        payment_method: itemsDetail.purchaseOrder.paymentInfo,
        billing_address: {
          name: user.name,
          street: billingAddress.street,
          city: billingAddress.city,
          state: billingAddress.region.name,
          country: billingAddress.country.name,
          phone: user.phone,
          email: user.email,
        },
      },
      items,
    });

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
