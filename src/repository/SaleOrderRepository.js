const uuid = require('uuid/v4');

function applyFilter(query, { statuses, purchaseOrder }, user) {
  if (!query.$and) {
    query.$and = [];
  }

  if (user) {
    query.$and.push({
      seller: user.id
    });
  }

  if (statuses.length > 0) {
    query.$and.push({
      $or: statuses.map((item) => ({ status: item }))
    });
  }

  if (purchaseOrder) {
    query.$and.push({
      purchaseOrder: purchaseOrder,
    });
  }
}

class SaleOrderRepository {
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
    return this.model.find({ seller: user.id });
  }

  async create(data) {
    const document = new this.model({
      _id: uuid(),
      ...data,
    });
    return document.save();
  }

  async get({ filter, page, user }) {
    const query = {};
    applyFilter(query, filter, user);
    return this.model.find(
      query,
      null,
      {
        limit: page.limit,
        skip: page.skip,
      },
    );
  }

  async getTotal(filter, user) {
    const query = {};
    applyFilter(query, filter, user);
    return this.model.countDocuments(query);
  }

  async updateStatus(status, id) {
    const order = await this.getById(id);
    order.status = status;
    return order.save();
  }

  async updateInvoiceUrl(url, id) {
    const order = await this.getById(id);
    order.packingslip = url;
    return order.save();
  }
}

module.exports = SaleOrderRepository;
