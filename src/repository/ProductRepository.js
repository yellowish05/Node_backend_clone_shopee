/* eslint-disable no-param-reassign */
function elasticFilter(query, filter) {
  if (!query.$and) {
    query.$and = [
      { isDeleted: false },
    ];
  }
  if (filter) {
    query.$and.push({
      $or: [
        { title: { $regex: `^.*${filter}.*`, $options: 'i' } },
        { description: { $regex: `^.*${filter}.*`, $options: 'i' } },
      ]
    })
  }
}

function transformSortInput({ feature, type }) {
  const availableFeatures = {
    CREATED_AT: 'createdAt',
    PRICE: 'sortPrice',
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
  searchQuery, categories, brands, price, sellers, blackList,
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
    if (price.min) {
      query.$and.push({
        $or: price.min.map(({ amount, currency }) => ({ price: { $gte: amount }, currency })),
      });
    }

    if (price.max) {
      query.$and.push({
        $or: price.max.map(({ amount, currency }) => ({ price: { $lte: amount }, currency })),
      });
    }
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

  if (blackList && blackList.length > 0) {
    query.$and.push({
      seller: { $nin: blackList },
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

  async getByIds(ids) {
    return this.model.find({ _id: ids, isDeleted: false });
  }

  async findDuplicate(data) {
    return this.model.findOne({
      title: data.title,
      description: data.description,
      price: data.price,
      isDeleted: false
    });
  }

  /**
   * @deprecated
   */
  async findByIds(ids) {
    return this.model.find({ _id: ids, isDeleted: false });
  }

  async isShippingBoxInUse(boxId) {
    return this.model.findOne({ shippingBox: boxId })
      .then((product) => product !== null);
  }

  async create(data) {
    if (data.description.length > 1023) {
      data.description = data.description.substring(0, 1008).concat('...');
    }

    const product = new this.model(data);
    return product.save();
  }

  async createFromCSV(data) {
    if (data.description.length > 1023) {
      data.description = data.description.substring(0, 1008).concat('...');
    }

    if (data.customCarrier === undefined) {
      throw { errors: { customCarrier: { message: "customCarrier with that id doesn't exist" } } };
    }

    // avoid duplicate if title, description, and price are exactly the same
    const existing = await this.findDuplicate(data);

    if (existing) {
      return existing;
    } else {
      const product = new this.model(data);
      return product.save();
    }
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

  async loadList(ids) {
    return this.model.find({ _id: { $in: ids } });
  }

  async es_search(filter, page) {
    const query = {};
    elasticFilter(query, filter);

    return this.model.find(
      query,
      null,
      {
        limit: page.limit,
        skip: page.skip,
      },
    );
  }
  async getTotal_es(filter) {
    const query = {};
    elasticFilter(query, filter);
    return this.model.countDocuments(query);
  }
}

module.exports = ProductRepository;
