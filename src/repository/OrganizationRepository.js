
class OrganizationRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ id });
  }

  async create(data) {
    if (!data.owner) {
      throw Error('Owner is required!');
    }

    const organization = new this.model({
      id: data.id,
      owner: data.owner,
      name: data.name,
      type: data.type,
      address: data.address,
      billingAddress: data.billingAddress,
      payoutInfo: data.payoutInfo,
      sellingTo: data.sellingTo,
      domesticShippingCourier: data.domesticShippingCourier,
      internationalShippingCourier: data.internationalShippingCourier,
      returnPolicy: data.returnPolicy,
    });

    return organization.save();
  }

  async update(id, data) {
    const organization = await this.model.findOne({ id }).populate('owner');
    if (!organization) {
      throw Error(`Organization "${id}" does not exist!`);
    }

    organization.billingAddress = data.billingAddress || organization.billingAddress;
    organization.address = data.address || organization.address;

    return organization.save();
  }

  async getAll(query = {}) {
    return this.model.find(query).populate('owner');
  }

  async getById(id) {
    return this.model.findOne({ id }).populate('owner');
  }
}

module.exports = OrganizationRepository;
