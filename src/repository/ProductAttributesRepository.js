const uuid = require('uuid/v4');

class ProductAttributesRepository {
    constructor(model) {
        this.model = model;
    }

    async getByIds(ids) {
        if (ids != null)
            return this.model.find({ _id: ids });
        return {}
    }

    async getById(id) {
        return this.model.findOne({ _id: id });
    }

    async findAttributesByProductId(id) {
        return this.model.find({ productId: id });
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
            ...data
        });
        return productAttr.save();
    }
}

module.exports = ProductAttributesRepository;