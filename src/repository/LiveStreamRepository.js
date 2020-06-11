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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
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

  async toggleLike(id, count) {
    const liveStream = await this.load(id);
    if (!liveStream) {
      throw Error(`Live Stream "${id}" does not exist!`);
    }
    liveStream.realLikes += count;
    return liveStream.save();
  }

  async update(id, data, flag) {
    const liveStream = await this.load(id);
    if (!liveStream) {
      throw Error(`Live Stream "${id}" does not exist!`);
    }

    liveStream.title = data.title || liveStream.title;
    liveStream.status = data.status || liveStream.status;
    if (flag == 0) {
      liveStream.views = Number(liveStream.views) + data.views || liveStream.views;
      liveStream.likes = Number(liveStream.likes) + data.likes || liveStream.likes;
    } else {
      liveStream.views = data.views || liveStream.views;
      liveStream.likes = data.likes || liveStream.likes;
    }
    return liveStream.save();
  }

  async updateCount(id, length, tag, view) {
    const liveStream = await this.load(id);
    let fakeViews = 0;
    let fakeLikes = 0;
    const timelist = [20, 60, 120, 240, 420, 660, 1200];
    const viewlimit = [3, 6, 11, 21, 31, 46, 60];
    const likelimit = [2, 4, 8, 17, 25, 34, 45];
    let index = 0;

    timelist.forEach((item) => {
      if (length > item) { index++; }
    });

    if (timelist[index] && index > 0) {
      fakeViews = getRandomInt(viewlimit[index], viewlimit[index - 1]);
      fakeLikes = getRandomInt(likelimit[index], likelimit[index - 1]);
    } else if (index == 0) {
      fakeViews = getRandomInt(viewlimit[index], 1);
      fakeLikes = getRandomInt(likelimit[index], 1);
    }


    if (!liveStream) {
      throw Error(`Live Stream "${id}" does not exist!`);
    }

    if (view == 'view' && tag == 'real') { liveStream.realViews += 1; } else if (view == 'like' && tag == 'real') {
      liveStream.realLikes += 1;
    } else {
      liveStream.fakeLikes += fakeLikes;
      liveStream.fakeViews += fakeViews;
    }

    liveStream.save();

    return liveStream;
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

  async getViews(id) {
    const liveStream = await this.load(id);
    return Number(liveStream.fakeViews) + Number(liveStream.realViews);
  }

  async getLikes(id) {
    const liveStream = await this.load(id);
    return Number(liveStream.fakeLikes) + Number(liveStream.realLikes);
  }
}

module.exports = LiveStreamRepository;
