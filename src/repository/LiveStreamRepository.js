function transformSortInput({ feature, type }) {
  const availableFeatures = {
    CREATED_AT: 'createdAt',
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

function transformFilter({
  searchQuery, experiences, categories, cities, statuses, streamers, blackList, product,
}) {
  const emptyQuery = {};
  const query = {
    $and: [],
  };

  if (searchQuery) {
    query.$and.push({
      title: { $regex: `^.*${searchQuery}.*`, $options: 'i' },
    });
  }

  if (experiences.length > 0) {
    query.$and.push({
      experience: { $in: experiences },
    });
  }

  if (categories.length > 0) {
    query.$and.push({
      categories: { $in: categories },
    });
  }

  if (cities.length > 0) {
    query.$and.push({
      city: { $in: cities },
    });
  }

  if (statuses.length > 0) {
    query.$and.push({
      status: { $in: statuses },
    });
  }

  if (streamers.length > 0) {
    query.$and.push({
      streamer: { $in: streamers },
    });
  }

  if (product) {
    query.$and.push({
      products: product,
    });
  }

  if (blackList && blackList.length > 0) {
    query.$and.push({
      streamer: { $nin: blackList },
    });
  }

  return query.$and.length > 0 ? query : emptyQuery;
}


class LiveStreamRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const liveStream = new this.model(data);

    return liveStream.save();
  }

  async update(id, data, flag) {
    const liveStream = await this.load(id);
    if (!liveStream) {
      throw Error(`Live Stream "${id}" does not exist!`);
    }

    liveStream.title = data.title || liveStream.title;
    liveStream.status = data.status || liveStream.status;
    if (flag == 0){
      liveStream.views = Number(liveStream.views) + data.views || liveStream.views;
      liveStream.likes = Number(liveStream.likes) + data.likes || liveStream.likes;
    }
    else {
      liveStream.views = data.views || liveStream.views;
      liveStream.likes = data.likes || liveStream.likes;
    }
    return liveStream.save();
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }

  async getOne(query = {}) {
    return this.model.findOne(query);
  }

  async get({ filter, sort, page }) {
    return this.model
      .find(
        transformFilter(filter),
        null,
        {
          sort: transformSortInput(sort),
          limit: page.limit,
          skip: page.skip,
        },
      );
  }

  async getTotal(filter) {
    return this.model
      .countDocuments(
        transformFilter(filter),
      );
  }
}

module.exports = LiveStreamRepository;
