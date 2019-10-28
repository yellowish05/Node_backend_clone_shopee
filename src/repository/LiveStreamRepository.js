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

function transformFilter({ experiences, categories, cities }) {
  const query = {};

  if (experiences.length > 0) {
    query.experience = { $in: experiences };
  }

  if (categories.length > 0) {
    query.categories = { $in: categories };
  }

  if (cities.length > 0) {
    // TODO: Need implement cities
  }

  return query;
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

  async getAll(query = {}) {
    return this.model.find(query).populate('streamer viewers preview');
  }

  async getById(id) {
    return this.model.findOne({ _id: id }).populate('streamer viewers preview');
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
      )
      .populate('streamer viewers preview');
  }

  async getTotal(filter) {
    return this.model
      .countDocuments(
        transformFilter(filter),
      );
  }
}

module.exports = LiveStreamRepository;
