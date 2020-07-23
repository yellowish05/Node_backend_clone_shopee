const path = require('path');
const uuid = require('uuid/v4');
const AWS = require('aws-sdk');
const axios = require('axios');

const { aws, cdn } = require(path.resolve('config'));
const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));

const s3 = new AWS.S3({
  accessKeyId: aws.aws_api_key,
  secretAccessKey: aws.aws_access_key
});

const buckets = async (data) => {
  let url, path;

  switch (data.bucket) {
    case "vendors-seller-dashboard":
      path = `/${data.name}/Product%20Images/${data.photo}`;
      path = path.split(' ').join('%20');
      url = `${cdn.vendorBuckets}${path}`;
      break;
    case "aliexpress-scrapped-images-full-size":
      path = `/${data.photo}`;
      path = path.split(' ').join('%20');
      url = `${cdn.aliexpress}${path}`;
      break;
  }

  return { url, path };
}

class AssetRepository {

  constructor(model) {
    this.model = model;
  }

  /**
   * @deprecated
   */
  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async getById(id) {
    return this.model.findOne({ _id: id });
  }

  async getByIds(ids) {
    return this.model.find({ _id: ids });
  }

  async getByPath(path) {
    return await this.model.findOne({ path: path });
  }

  async getCsvAssetByStatus(status, userid) {
    return await this.model.find({ status: status, owner: userid, type: "CSV" });
  }

  async create(data) {
    const asset = new this.model(data);
    return asset.save();
  }

  async deleteAsset(data) {
    return this.model.findAndRemove({ id: data.id })
  }

  async updateStatusByPath(path, status) {
    const asset = await this.getByPath(path);
    if (!asset) {
      throw Error(`"${path}" does not exist!`);
    }

    asset.status = status;

    return asset.save();
  }

  async createFromUri(data) {
    return axios.get(data.url, { responseType: 'arraybuffer' })
      .then((response) => {
        const id = uuid();
        const { ext, type } = MIMEAssetTypes.detect(response.headers['content-type']);
        const imgPath = `${data.userId}/${id}.${ext}`;
        return Promise.all([
          s3.upload({
            Bucket: aws.user_bucket,
            Key: imgPath,
            Body: response.data,
          }).promise(),
          this.model.create({
            _id: id,
            owner: data.userId,
            path: imgPath,
            url: `${cdn.userAssets}/${imgPath}`,
            type,
            size: response.data.length * 8,
            mimetype: response.headers['content-type'],
          })]);
      })
      .then(([, asset]) => asset)
      .catch((error) => {
        throw new Error(error);
      });
  }

  async createFromCSVForUsers(data) {
    let url = `${cdn.vendorBuckets}/${data.name}/Logo/${data.photo}`;
    url = url.split(" ").join("%20");

    const assetData = {
      _id: uuid(),
      status: "UPLOADED",
      owner: data.owner,
      path: data.path.split(" ").join("%20"),
      url: url,
      type: "IMAGE",
      size: 1000,
      mimetype: 'image/jpeg',
    }

    if (await this.getByPath(data.path)) {
      return await this.getByPath(data.path);
    } else {
      const asset = new this.model(assetData);
      return asset.save();
    }
  }

  async createFromCSVForProducts(data) {
    const { url, path } = await buckets(data).then(x => x).catch(err => err);

    const assetData = {
      _id: uuid(),
      status: "UPLOADED",
      owner: data.owner,
      path: path,
      url: url,
      type: "IMAGE",
      size: 1000,
      mimetype: 'image/jpeg',
    }
    const asset = new this.model(assetData);
    return await asset.save().then(asset => {
      return asset
    }).catch(err => this.getByPath(data.path));
  }

}

module.exports = AssetRepository;