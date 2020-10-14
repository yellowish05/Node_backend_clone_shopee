
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

    async findAssetsByProductId(id) {
        return this.model.find({ productId: id });
    }

    async getByAttr(productId, color, size) {
        if (color != "" && size != "")
            return this.model.findOne({ productId, color, size });
        return null;
    }

    async create(data) {
        const productAttr = new this.model(data);
        return productAttr.save();
    }
}

module.exports = ProductAttributesRepository;