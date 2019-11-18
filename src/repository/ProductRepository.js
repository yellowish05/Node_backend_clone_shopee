/* eslint-disable no-param-reassign */
function transformSortInput({ feature, type }) {
  const availableFeatures = {
    CREATED_AT: 'createdAt',
    PRICE: 'price',
  };

  const availableTypes = {
    DESC: -1,
    ASC: 1,
  };

  if (typeof availableFeatures[feature] === 'undefined') {
    throw Error(`Sorting by "${feature}" feature is not provided.`);
  }

  if (typeof availableTypes[type] === 'undefined') {
    throw Error(`Sorting type "${feature}" is not provided.`);
  }

  return { [availableFeatures[feature]]: availableTypes[type] };
}

function applyFilter(query, {
  searchQuery, categories, brands, price, sellers,
}) {
  if (!query.$and) {
    query.$and = [
      { isDeleted: false },
    ];
  }

  if (searchQuery) {
    query.$and.push({
      $or: [
        { title: { $regex: `^.*${searchQuery}.*`, $options: 'i' } },
        { description: { $regex: `^.*${searchQuery}.*`, $options: 'i' } },
      ],
    });
  }

  if (price) {
    const priceQuery = {};

    if (price.min) {
      priceQuery.$gte = price.min;
    }

    if (price.max) {
      priceQuery.$lte = price.max;
    }

    query.$and.push({ price: priceQuery });
  }

  if (categories) {
    query.$and.push({
      category: { $in: categories },
    });
  }

  if (brands) {
    query.$and.push({
      brand: { $in: brands },
    });
  }

  if (sellers) {
    query.$and.push({
      seller: { $in: sellers },
    });
  }
}

class ProductRepository {
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
    const product = new this.model(data);
    return product.save();
  }

  async get({ filter, sort, page }) {
    const query = {};
    applyFilter(query, filter);

    return this.model.find(
      query,
      null,
      {
        sort: transformSortInput(sort),
        limit: page.limit,
        skip: page.skip,
      },
    );
  }

  async getTotal(filter) {
    const query = {};
    applyFilter(query, filter);
    return this.model.countDocuments(query);
  }
}

module.exports = ProductRepository;
