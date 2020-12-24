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
    SOLD: 'sold',
    TITLE: 'title',
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
  searchQuery, categories, brands, price, sellers, blackList, isWholeSale = false, isFeatured, ids = [],
}) {

  if (!query.$and) {
    query.$and = [
      { isDeleted: false },
    ];
  }

  if (searchQuery) {
    $orWithTags = searchQuery.split(' ')
      .map(piece => piece.trim())
      .filter(piece => !!piece)
      .map(piece => ({ hashtags: { $regex: `${piece}`, $options: 'i' } }));
    query.$and.push({
      $or: [
        { title: { $regex: `^.*${searchQuery}.*`, $options: 'i' } },
        { description: { $regex: `^.*${searchQuery}.*`, $options: 'i' } },
        { slug: { $regex: `^.*${searchQuery}.*`, $options: 'i' } },
        ...$orWithTags,
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

  if (sellers && Array.isArray(sellers) && sellers.length) {
    query.$and.push({
      seller: { $in: sellers },
    });
  }

  if (!isWholeSale) {
    query.$and.push({
      wholesaleEnabled: {$ne: true}
    })
  } else {
    query.$and.push({
      wholesaleEnabled: true
    })
  }

  if (blackList && blackList.length > 0) {
    query.$and.push({
      seller: { $nin: blackList },
    });
  }

  if (isFeatured !== undefined) {
    query.$and.push({
      isFeatured: isFeatured ? true : {$ne: true},
    });
  }  

  if (ids && ids.length > 0) {
    query.$and.push({
      _id: { $in: ids }
    });
  }
}

function applyFilter4Theme(query, { brands, productCategories, hashtags }) {
  if (!query.$and) {
    query.$and = [
      { isDeleted: false, wholesaleEnabled: { $ne: true } },
    ];
  }
  const $or = [];
  if (brands.length) {
    $or.push({ brand: { $in: brands } });
  }

  if (productCategories.length) {
    $or.push({ category: { $in: productCategories } });
  }

  if (hashtags.length) {
    hashtags.forEach(hashtag => {
      $or.push({ hashtags: { $regex: `${hashtag}`, $options: 'i' } });
    })
  }

  if ($or.length) {
    query.$and.push({ $or });
  }
}

class ProductRepository {
  constructor(model) {
    this.model = model;
  }

  async getById(id) {
    return this.model.findOne({ _id: id, isDeleted: false });
  }

  async getAll() {
    return this.model.find({});
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
      if (existing.attrs === undefined || existing.attrs.length == 0) {
        existing.attrs = data.attrs;
        return existing.save();
      }
      return existing;
    } else {
      const product = new this.model(data);
      return product.save();
    }
  }

  async get({ filter, sort, page }) {
    let query = {};
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
    let query = {};
    applyFilter(query, filter);
    return this.model.countDocuments(query);
  }

  async get4Theme({ filter, sort, page }) {
    const query = {};
    applyFilter4Theme(query, filter);
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

  async getTotal4Theme(filter) {
    const query = {};
    applyFilter4Theme(query, filter);
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

  async checkAmount(productId, quantity) {
    try {
      const product = await this.getById(productId);
      if (!product)
        throw Error(`Product with id "${productId}" does not exist!`);
      if (product.quantity - quantity < 1) 
        return false;
      return true;
    } catch (err) {
      throw new Error(err);
    }
  }
}

module.exports = ProductRepository;
