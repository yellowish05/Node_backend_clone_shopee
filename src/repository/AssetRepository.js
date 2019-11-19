const path = require('path');
const uuid = require('uuid/v4');
const AWS = require('aws-sdk');
const axios = require('axios');

const { aws, cdn } = require(path.resolve('config'));
const MIMEAssetTypes = require(path.resolve('src/lib/MIMEAssetTypes'));

const s3 = new AWS.S3();

class AssetRepository {
  constructor(model) {
    this.model = model;
  }

  async load(id) {
    return this.model.findOne({ _id: id });
  }

  async create(data) {
    const asset = new this.model(data);
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
}

module.exports = AssetRepository;
