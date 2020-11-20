const path = require('path');
const fs = require('fs');
const request = require('request');
const sizeOf = require('image-size');
const resizeImg = require('resize-img');

const repository = require(path.resolve('src/repository'));

const AWS = require('aws-sdk');

const { aws, cdn } = require(path.resolve('config'));
const s3 = new AWS.S3();

module.exports.AssetService = {
  async resizeImage({ assetId, width, height }) {
    let _asset, _localPath;
    return repository.asset.getById(assetId)
      .then(asset => {
        if (!asset) {
          throw Object.assign(new Error(`Asset with id "${assetId}" does not exist!`), { code: 400 });
        }
        _asset = asset;
        return this.downloadImgToLocal(asset.url)
      })
      .then(localPath => {
        _localPath = localPath;
        return this.getImageResolution(localPath);
      })
      .then(dimentions => {
        
      })
      .catch(error => {
        console.log(error);
        return false;
      })
  }

  async downloadImgToLocal(url) {
    return new Promise((reject, resolve) => {
      request.head(url, (err, res, body) => {
        console.log('content-type', res.headers['content-type']);
        console.log('content-length', res.headers['content-length']);

        request(url).pipe(fs.createWriteStream(path.join(os.tmpdir(), url.split('/').pop())))
          .on('close', () => {
            resolve(path.join(os.tmpdir(), url.split('/').pop()));
          })
          .on('error', () => {
            reject(false);
          })
      });
    });
  }

  async getImageResolution(path) {
    return new Promise((resolve, reject) => {
      sizeOf(path, (err, dimentions) => {
        err ? reject(err) : resolve(dimentions);
      });
    }));
  }
}