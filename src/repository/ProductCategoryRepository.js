/* eslint-disable no-param-reassign */
function getSearchQueryByName(query) {
  return { name: { $regex: `^${query}.*`, $options: 'i' } };
}

function matchHashtag(category, tags) {
  if (!tags.length) return false;

  for (let hashtag of (category.hashtags || [])) {
    for (let tag of tags) {
      if (hashtag.includes(tag)) return true;
    }
  }
  return false;
}

function getAllUnderParent(allCategories, ids = [], tags) {
  if (ids.length === 0) return [];

  let categories = allCategories.filter(category => ids.includes(category._id) || ids.includes(category.parent) || matchHashtag(category, tags));
  const newIds = categories.map(category => category._id);
  const diff = newIds.filter(id => !ids.includes(id));
  if (diff.length === 0) {
    return allCategories.filter(category => newIds.includes(category._id));
  } else {
    return getAllUnderParent(allCategories, newIds, tags);
  }
}

class ProductCategoryRepository {
  constructor(model) {
    this.model = model;
  }

  async getAll() {
    return this.model.find().sort('level');
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }
  
  async getByParent(id) {
    return this.model.find({ parent: id }).sort('order');
  }

  async getUnderParents(ids, tags = []) {
    return this.getAll()
      .then(categories => {
        return getAllUnderParent(categories, ids, tags);
      });
  }

  async findByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async searchByName(query, { skip, limit }) {
    return this.model.find(
      getSearchQueryByName(query),
      null,
      { limit, skip, sort: { order: 1 } },
    );
  }

  async getCountBySearch(query) {
    return this.model.countDocuments(getSearchQueryByName(query));
  }

  async getCountByParent(parent) {
    return this.model.countDocuments({ parent });
  }

  async reindex() {
    const categoryList = await this.model.find();
    const categoriesById = categoryList.reduce((res, cat) => ({ ...res, [cat.id]: cat }), {});
    const parentIds = categoryList.map((cat) => cat.parent).filter((id) => id);

    function fetchParentIds(entityId) {
      const parentId = categoriesById[entityId].parent;
      let parents = [entityId];
      if (parentId) {
        parents = parents.concat(fetchParentIds(parentId));
      }
      return parents;
    }

    const updatePromises = categoryList.map(async (cat) => {
      if (cat.parent) {
        cat.parents = fetchParentIds(cat.parent);
      }
      if (parentIds.includes(cat.id)) {
        cat.hasChildren = true;
      }

      return cat.save();
    });

    return Promise.all(updatePromises);
  }
}

module.exports = ProductCategoryRepository;
