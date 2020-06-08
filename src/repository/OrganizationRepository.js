/* eslint-disable no-param-reassign */
const uuid = require('uuid/v4');

class OrganizationRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    if (!data.owner) {
      throw Error('Owner is required!');
    }

    const organization = new this.model({
      ...data,
      _id: uuid(),
    });

    return organization.save();
  }

  async update(organization, data) {
    if (!organization) {
      return this.create(data);
    }

    organization.billingAddress = data.billingAddress || organization.billingAddress;
    organization.address = data.address || organization.address;
    organization.payoutInfo = data.payoutInfo || organization.payoutInfo;
    organization.returnPolicy = data.returnPolicy || organization.returnPolicy;
    organization.carriers = data.carriers || organization.carriers;
    organization.workInMarketTypes = data.workInMarketTypes || organization.workInMarketTypes;
    return organization.save();
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByUser(id) {
    return this.model.findOne({ owner: id });
  }
}

module.exports = OrganizationRepository;
