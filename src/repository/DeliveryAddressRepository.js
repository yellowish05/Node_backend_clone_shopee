/* eslint-disable no-param-reassign */
const uuid = require('uuid/v4');

class DeliveryAddressRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id, isDeleted: false });
  }

  async findByIds(ids) {
    return this.model.find({ _id: ids, isDeleted: false });
  }

  async create(data) {
    const existingAddress = await this.model.findOne({
      owner: data.owner,
      label: data.label,
      'address.street': data.street,
      'address.city': data.city,
      'address.region': data.region,
      'address.country': data.country,
      'address.zipCode': data.zipCode,
      'address.addressId': data.addressId,
      'address.description': data.description
    });

    if (existingAddress) {
      existingAddress.isDeleted = false;
      return existingAddress.save();
    }

    const deliveryAddress = new this.model(
      {
        _id: uuid(),
        owner: data.owner,
        label: data.label,
        address: {
          isDeliveryAvailable: true,
          addressId: data.addressId,
          ...data,
        },
      },
    );
    return deliveryAddress.save();
  }

  async update(data) {
    return this.getById(data.id)
      .then((existingAddress) => {
        existingAddress.label = data.label;
        existingAddress.address.addressId = data.savedAddressId;
        existingAddress.address.street = data.street;
        existingAddress.address.city = data.city;
        existingAddress.address.region = data.region;
        existingAddress.address.country = data.country;
        existingAddress.address.zipCode = data.zipCode;
        existingAddress.address.description = data.description;
        return existingAddress.save();
      });
  }

  async getAll(query) {
    query.isDeleted = false;
    return this.model.find(query);
  }

  async delete(id) {
    return this.model.update({ _id: id }, { isDeleted: true });
  }
}

module.exports = DeliveryAddressRepository;
