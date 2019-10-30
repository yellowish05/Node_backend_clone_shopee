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
  experiences, categories, cities, statuses,
}) {
  const query = {};
  const populate = [];

  if (experiences.length > 0) {
    query.experience = { $in: experiences };
  }

  if (categories.length > 0) {
    query.categories = { $in: categories };
  }

  if (cities.length > 0) {
    // TODO: Need implement cities
  }

  if (statuses.length > 0) {
    populate.push({
      $lookup:
      {
        from: 'streamchannels',
        localField: 'channel',
        foreignField: '_id',
        as: 'channel',
      },
    },
    { $unwind: '$channel' });
    query['channel.status'] = { $in: statuses };
  }

  return { query, populate };
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

  async update(id, data) {
    const liveStream = await this.load(id);
    if (!liveStream) {
      throw Error(`Live Stream "${id}" does not exist!`);
    }

    liveStream.title = data.title || liveStream.title;
    liveStream.statistics = data.statistics || liveStream.statistics;

    return liveStream.save();
  }

  async getAll(query = {}) {
    return this.model.find(query);
  }

  async getOne(query = {}) {
    return this.model.findOne(query);
  }

  // returns {total: Number, collection: <T>[]}
  async get({ filter, sort, page }) {
    const { query, populate } = transformFilter(filter);
    return this.model.aggregate([
      ...populate,

      { $match: query },
      { $sort: transformSortInput(sort) },
      {
        $addFields: { id: '$_id' },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          collection: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          total: 1,
          collection: {
            $slice: ['$collection', page.skip, page.limit],
          },
        },
      },

    ]).exec().then((result) => (result.length > 0 ? result[0] : { collection: [], total: 0 }));
  }
}

module.exports = LiveStreamRepository;
