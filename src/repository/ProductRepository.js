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
  searchQuery, categories, brands, price, sellers, blackList, isWholeSale = false, isFeatured, ids = [], hashtags = [], themeBrands = [], themeCategories = [],
}) {
  const $and = [{ isDeleted: false }];
  // if (!$and) {
  //   $and = [
  //     { isDeleted: false },
  //   ];
  // }

  if (searchQuery) {
    $and.push({
      $or: [
        { title: { $regex: `^.*${searchQuery}.*`, $options: 'i' } },
        { description: { $regex: `^.*${searchQuery}.*`, $options: 'i' } },
        { slug: { $regex: `^.*${searchQuery}.*`, $options: 'i' } },
      ],
    });
  }

  if (price) {
    if (price.min) {
      $and.push({
        $or: price.min.map(({ amount, currency }) => ({ price: { $gte: amount }, currency })),
      });
    }

    if (price.max) {
      $and.push({
        $or: price.max.map(({ amount, currency }) => ({ price: { $lte: amount }, currency })),
      });
    }
  }

  if (categories) {
    $and.push({
      category: { $in: categories },
    });
  }

  if (brands) {
    $and.push({
      brand: { $in: brands },
    });
  }

  if (sellers) {
    $and.push({
      seller: { $in: sellers },
    });
  }

  if (!isWholeSale) {
    $and.push({
      wholesaleEnabled: {$ne: true}
    })
  } else {
    $and.push({
      wholesaleEnabled: true
    })
  }

  if (blackList && blackList.length > 0) {
    $and.push({
      seller: { $nin: blackList },
    });
  }

  if (isFeatured !== undefined) {
    $and.push({
      isFeatured: isFeatured ? true : {$ne: true},
    });
  }  

  if (ids && ids.length > 0) {
    $and.push({
      _id: { $in: ids }
    });
  }

  if (hashtags.length || themeBrands.length || themeCategories.length) {  
    console.log('[hashtags]', hashtags.length)
    $orByTheme = [];
    if (hashtags.length) {
      $orByTheme.concat(hashtags.map(hashtag => ({ hashtags: { $regex: `${hashtag}`, $options: 'i' } })));
    }
    if (themeBrands.length) {
      $orByTheme.push({ brands: {$in: themeBrands } });
    }
    if (themeCategories.length) {
      $orByTheme.push({ category: { $in: themeCategories } });
    }

    query.$or = [ ...$orByTheme, { $and } ];
  } else {
    query.$and = $and;
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
    const query = {};
    applyFilter(query, filter);
    console.log('[query]', query)
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
    console.log('[query]', filter.hashtags, query)
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
