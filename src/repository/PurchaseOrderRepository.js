const uuid = require('uuid/v4');

class PurchaseOrderRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getAll() {
    return this.model.find();
  }

  async find({ user }) {
    return this.model.find({ buyer: user.id });
  }

  async getByBuyer(id) {
    return this.model.find({ buyer: id });
  }

  async findByTransactionId(id) {
    return this.model.findOne({ payments: id });
  }

  async create(data) {
    const document = new this.model({
      _id: uuid(),
      ...data,
    });
    return document.save();
  }

  async update(data) {
    const order = await this.getById(data.id);

    order.deliveryOrders = data.deliveryOrders ? data.deliveryOrders : order.deliveryOrders;
    order.items = data.items ? data.items : order.items;
    order.payments = data.payments ? data.payments : order.payments;
    order.isPaid = data.isPaid ? data.isPaid : order.isPaid;
    order.currency = data.currency ? data.currency : order.currency;
    order.quantity = data.quantity ? data.quantity : order.quantity;
    order.price = data.price ? data.price : order.price;
    order.deliveryPrice = data.deliveryPrice ? data.deliveryPrice : order.deliveryPrice;
    order.total = data.total ? data.total : order.total;
    order.buyer = data.buyer ? data.buyer : order.buyer;
    order.paymentClientSecret = data.paymentClientSecret ? data.paymentClientSecret : order.paymentClientSecret;
    order.publishableKey = data.publishableKey ? data.publishableKey : order.publishableKey;

    return order.save();
  }

  async getByClientSecret(id) {
    return this.model.findOne({ paymentClientSecret: id });
  }

  async addInovicePDF(id, url) {
    const purchaseOrder = await this.getById(id);
    purchaseOrder.invoicePDF = url || purchaseOrder.invoicePDF;

    return purchaseOrder.save();
  }

  async addPackingSlip(id, url) {
    const purchaseOrder = await this.getById(id);
    purchaseOrder.packingSlips.push(url);

    return purchaseOrder.save();
  }

  // async getInvoicePDF(id) {
  //   const purchaseOrder = await this.getById(id);

  //   return purchaseOrder.invoicePDF;
  // }

  // async getPackingSlips(id) {

  // }
}

module.exports = PurchaseOrderRepository;
