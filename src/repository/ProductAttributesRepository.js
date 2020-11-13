const uuid = require('uuid/v4');

class ProductAttributesRepository {
  constructor(model) {
    this.model = model;
  }

  async getByIds(ids) {
    if (ids != null) { return this.model.find({ _id: ids }); }
    return {};
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async findAttributesByProductId(id) {
    return this.model.find({ productId: id });
  }

  async findDuplicate(data) {
    return this.model.find({
      variation: data.variation,
      productId: data.productId,
    });
  }

  async getByAttr(productId, variation) {
    if (Object.keys(variation).length === 0) { return this.model.findOne({ productId, variation }); }
    return null;
  }

  async updateProductId(id, productId) {
    const attribute = await this.getById(id);
    if (!attribute) {
      // throw Error(`"${path}" does not exist!`);
      return null;
    }

    attribute.productId = productId;

    return attribute.save();
  }

  async create(data) {
    const productAttr = new this.model({
      _id: uuid(),
      ...data,
    });
    return productAttr.save();
  }

  async findOrCreate(data) {
    // const attribute = await this.findDuplicate(data);

    // if (attribute && attribute.length > 0) {
    //     return attribute;
    // } else {
    const productAttr = new this.model({
      _id: uuid(),
      ...data,
    });
    return productAttr.save();
    // }
  }

  async getByProduct(id) {
    return this.model.find({ productId: id });
  }

  async checkDuplicatedSKU(sku) {
    return this.model.countDocuments({ sku });
  }

  async checkAmountByAttr(id, qty) {
    const attribute = await this.getById(id);
    if (attribute.quantity - qty > 1) { return true; }

    return false;
  }
}

module.exports = ProductAttributesRepository;
