const path = require('path');
const { request, gql } = require('graphql-request');

const { baseURL, query: { getPurchaseOrder, getSaleOrder } } = require(path.resolve('config'));
const { VerificationEmailTemplate } = require(path.resolve('src/lib/Enums'));
const { InvoiceService } = require(path.resolve('src/lib/InvoiceService'));
const AbstractEmailService = require('./AbstractEmailService');

const repository = require(path.resolve('src/repository'));

class EmailService extends AbstractEmailService {
  sendWelcome(data) {
    const template = this.getTemplate('WELCOME');

    const params = this.getParams({ template, user: data.user });

    return this.send(params);
  }

  sendRecoverPasswordCode(data) {
    const template = this.getTemplate(VerificationEmailTemplate.RESET_PASSWORD);

    const params = this.getParams({ template, user: data.user, code: data.code });

    return this.send(params);
  }

  sendPasswordChanged(data) {
    const template = this.getTemplate('PASSWORD_CHANGED');

    const params = this.getParams({ template, user: data.user });

    return this.send(params);
  }

  sendPurchasedInfo(data, type) {
    const template = type == "invoice" ? this.getTemplate('INVOICE'): this.getTemplate("PACKINGSLIP");

    const params = this.getParams({ template, user: data.user });

    return this.send(params);
  }

  async sendInvoicePDFs(data) {
    const buyer = await repository.user.getById(data.buyer);
    await repository.purchaseOrder.getInvoicePDF(data.id)
      .then((pdf) => {
        if (pdf && pdf.length > 0) {
          return pdf;
        }

        return InvoiceService.getOrderDetails(data.id)
          .then((orderDetails) => InvoiceService.createInvoicePDF(orderDetails))
          .catch((err) => {
            throw new Error(err.message);
          });
      })
      .then(async (invoicePdf) => {
        const orderQuery = gql`${getPurchaseOrder}`;
        const variables = {
          orderID: data.id,
        };
        const itemsDetail = await request(`${baseURL}graphql`, orderQuery, variables);
        console.log("purchase order info => ", itemsDetail);

        buyer.type = 'buyer';
        await this.sendPurchasedInfo({
          user: buyer,
          orderId: itemsDetail.id,
          invoicePdf,
          createdAt: itemsDetail.createdAt.substring(0, 10),
          orderItems: itemsDetail.items
        }, "invoice");
      })
      .catch((err) => {
          throw new Error(err.message);
      });
  }

  async sendPackingSlipPDFs(data) {
    const saleOrders = await repository.saleOrder.get({
      filter: { purchaseOrder: data.id },
      page: {
        limit: 0,
        skip: 0
      },
      user: null,
    });

    await Promise.all(saleOrders.map(async (saleOrder) => repository.saleOrder.getPackingSlip(saleOrder.id)
        .then((orders) => {
            if (orders && orders.length > 0) { return orders; }

            return InvoiceService.getSalesOrderDetails(saleOrder.id)
              .then(async (orderDetails) => InvoiceService.createPackingSlip(orderDetails))
              .catch((err) => {
                throw new Error(err.message);
              });
        })
        .then(async (invoicePdf) => {
          const saleOrderQuery = gql`${getSaleOrder}`;
          const variables = {
            orderID: saleOrder.id,
          };
          const saleOrderInfo = await request(`${baseURL}graphql`, saleOrderQuery, variables);
          console.log("sale order info => ", saleOrderInfo);
          const seller = saleOrderInfo.items[0].seller;
          seller.type = 'seller';
          await this.sendPurchasedInfo({
              user: seller,
              orderId: saleOrderInfo.id,
              invoicePdf,
              createdAt: saleOrderInfo.createdAt.substring(0, 10),
              orderItems: saleOrderInfo.items
          }, "packingSlip")
        })
        .catch((err) => {
            throw new Error(err.message);
        }),
    ))
  }
}
module.exports.EmailService = new EmailService();
