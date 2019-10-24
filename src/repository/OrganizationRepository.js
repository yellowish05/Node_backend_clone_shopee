
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

    const organization = new this.model(data);

    return organization.save();
  }

  async update(id, data) {
    const organization = await this.getById(id);
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
    return this.model.findOne({ _id: id }).populate('owner');
  }
}

module.exports = OrganizationRepository;
