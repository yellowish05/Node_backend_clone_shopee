const path = require('path');
const uuid = require("uuid/v4");

const applyFilter = (query, { searchQuery }) => {
  const $or = [];
  if (searchQuery) {
    // query against name
    $or.push({ name: { $regex: `${searchQuery}`, $options: 'i' } });
    // query against hashtags
    $orWithTags = searchQuery.split(' ')
      .map(piece => piece.trim())
      .filter(piece => !!piece)
      .map(piece => ({ hashtags: { $regex: `${piece}`, $options: 'i' } }));
    $or.concat($orWithTags);
  }
  
  $or.length ? query = { $or } : null;
}

function transformSortInput({ feature, type }) {
  const availableFeatures = {
    CREATED_AT: 'createdAt',
    NAME: 'name',
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
class ThemeRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    if (!data._id) data = { ...data, _id: uuid() };
    const theme = new this.model(data);

    return theme.save();
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByIds(ids) {
    return this.model.find({ _id: { $in: ids } });
  }

  async getByName(name) {
    return this.model.findOne({ name });
  }

  async loadAll() {
    return this.model.find();
  }

  async deleteById(itemId) {
    if (typeof itemId !== 'string') {
      throw new Error(`Theme.delete expected id as String, but got "${typeof itemId}"`);
    }

    return this.model.deleteOne({ _id: itemId });
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

module.exports = ThemeRepository;
