const path = require('path');
const uuid = require('uuid/v4');
const promise = require('bluebird');

const repository = require(path.resolve('src/repository'));
const AWS = require('aws-sdk');
const { aws, cdn } = require(path.resolve('config'));
const csv = require('csvtojson');

const s3 = new AWS.S3();

module.exports = async (_, { path }) => {

    const params = {
        Bucket: aws.user_bucket,
        Key: path
    }

    return new Promise((resolve, reject) => {
        const stream = s3.getObject(params).createReadStream();

        const json = csv().fromStream(stream);

        resolve(json);
    }).then(data => {
        return promise.map(data, async (row, index) => {
            const user = {};

            user.address = {
                street: row.Address_street.split('/').join(','),
                city: row.City,
                region: row.Region,
                country: row.Country,
                zipCode: row.zipCode
            };

            user.location = {
                latitude: row.Latitude,
                longitude: row.Longitude
            };

            user.settings = {
                language: row.language || 'EN',
                currency: row.currency || 'USD',
                measureSystem: row.measureSystem || 'USC'
            };

            user._id = row.UID || uuid();

            user.brand_name = await new Promise((resolve, reject) => {
                return repository.brand.create({ _id: uuid(), name: row.brand_name.trim() }).then(res => {
                    resolve(user.brand_name = res.id || res);
                })
            })

            if (row.photo_jpg) {
                const assetData = {
                    name: row.name,
                    photo: row.photo_jpg,
                    owner: user._id,
                    path: `${row.name}/Logo/${row.photo_jpg}`,
                    url: aws.vendor_bucket
                }

                user.photo = await new Promise((resolve, reject) => {
                    return repository.asset.createFromCSVForUsers(assetData).then(res => {
                        resolve(user.photo = res || res.id);
                    })
                })
            }

            user.email = row.email;
            user.password = row.password || 'Shoclef123';
            user.number = row.phone_number;
            user.name = row.name;
            user.Role = row.Role || [];

            return repository.user.createFromCsv(user)
                .then(res => res)
                .catch(err => {
                    console.log("upload failed index: " + index + "\n", err);
                });
        }).then(res => {
            return res.filter(item => item);
        }).catch(err => {
            return err;
        })
    }).then(res => {
        return res;
    }).catch(err => {
        return err;
    })

}