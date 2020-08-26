const uuid = require('uuid/v4');

class PaymentMethodRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const doc = new this.model({
      ...data,
      _id: uuid(),
    });
    return doc.save();
  }

  async getActiveMethods(user) {
    if (!user || !['string', 'object'].includes(typeof user)) {
      throw new Error(`PaymentMethod.getActiveMethods expects "user" but gets "${typeof user}"`);
    }

    const query = {
      user,
      isActive: true,
    };
    return this.model.find(query).sort({ usedAt: -1 });
  }

  async add(data) {
    const existingPM = this.model.findOne({
      user: data.user,
      'data.brand': data.brand,
      'data.country': data.country,
      'data.customer': data.customer,
      'data.exp_month': data.exp_month,
      'data.exp_year': data.exp_year,
      'data.fingerprint': data.fingerprint,
      'data.last4': data.last4,
      'data.funding': data.funding,
    });

    if( existingPM )
      return existingPM;
    else {
      const newPM = new this.model({
        
      });
    }
  }
}

module.exports = PaymentMethodRepository;
