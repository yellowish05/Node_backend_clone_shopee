const path = require('path');
const uuid = require('uuid/v4');
const promise = require('bluebird');
const repository = require(path.resolve('src/repository'));
const AWS = require('aws-sdk');
const { aws, cdn } = require(path.resolve('config'));
const s3 = new AWS.S3();

module.exports = async (_, { path }) => {
    const params = {
        Bucket: aws.user_bucket,
        Key: path
    }
    return await new Promise((resolve, reject) => {
        s3.getObject(params, async (err, data) => {
            const csv = data.Body.toString("UTF-8").split('\n');
            let headers = csv[0].split(',');
            headers = await headers.map(x => x.trim());

            await promise.map(csv, async (row, index) => {
                if (index > 0 && row !== '') {

                    const columns = row.split(',');
                    let user = {};

                    await columns.map((column, colIndex) => {
                        if (column !== undefined) {
                            user[headers[colIndex]] = column.trim();
                        }
                    });

                    user.address = {
                        street: user.address.split(';').join(','),
                        city: user.city,
                        region: user.region,
                        country: user.country,
                        zipCode: user.zipCode
                    }

                    user.location = {
                        latitude: user.latitude,
                        longitude: user.longitude
                    }

                    user.settings = {
                        language: user.language,
                        currency: user.currency,
                        measureSystem: user.measureSystem
                    }

                    const {
                        id,
                        latitude,
                        longitude,
                        city,
                        region,
                        country,
                        zipCode,
                        language,
                        currency,
                        measureSystem,
                        ...properties
                    } = user

                    if (id) {
                        user = { _id: id, ...properties };
                    } else {
                        user = { _id: uuid(), ...properties };
                    }

                    user.brandName = await new Promise((resolve, reject) => {
                        return repository.brand.create({ _id: uuid(), name: user.brandName }).then(res => {
                            resolve(user.brandName = res.id || res);
                        })
                    })

                    if (user.photo) {
                        if (user.photo.includes(".jpg") ||
                            user.photo.includes(".jpeg") ||
                            user.photo.includes(".png")) {
                            const assetData = {
                                name: user.name,
                                photo: user.photo,
                                owner: user._id,
                                path: `${user.name}/Logo/${user.photo}`,
                                url: aws.vender_bucket
                            }
                            if (err)
                                reject(err);
                            user.photo = await new Promise((resolve, reject) => {
                                return repository.asset.createFromCSVForUsers(assetData).then(res => {
                                    resolve(user.photo = res || res.id);
                                })
                            })
                        }
                    }

                    // console.log("user ==========>", user);

                    return repository.user.createFromCsv(user).then(res => res).catch(err => err);
                }
            }).then(res => {
                resolve(res.filter(item => item));
            }).catch(err => {
                reject(err)
            })
        })
    }).then(res => {
        return res;
    }).catch(err => {
        return err;
    })
}
