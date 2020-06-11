const path = require('path')
const uuid = require('uuid/v4')
const promise = require('bluebird')

const repository = require(path.resolve('src/repository'))
const AWS = require('aws-sdk')
const { aws, cdn } = require(path.resolve('config'))
const csv = require('csvtojson')

const s3 = new AWS.S3()

module.exports = async (_, { path }) => {

    const params = {
        Bucket: aws.user_bucket,
        Key: path
    }

    return await new Promise((resolve, reject) => {
        s3.getObject(params, async (err, data) => {
            const csv = data.Body.toString("UTF-8").split('\n');
            const headers = csv[0].split(',');

            await promise.map(csv, async (row, index) => {
                if (index > 0) {
                    const columns = row.split(',');
                    let user = {};

                    columns.map((column, colIndex) => {
                        if (column !== undefined)
                            user[headers[colIndex].trim()] = column.trim();
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

                    const shippingBoxProperties = {
                        label: "medium",
                        owner: user._id,
                        width: 15,
                        height: 15,
                        length: 15,
                        unit: "INCH",
                        weight: 20,
                        unitWeight: "OUNCE"
                    }

                    await new Promise((resolve, reject) => {
                        return repository.shippingBox.findOrAdd(shippingBoxProperties).then(res => {
                            resolve(res.id || res)
                        })
                    })

                    user.brandName = await new Promise((resolve, reject) => {
                        return repository.brand.create({ _id: uuid(), name: user.brandName.trim() }).then(res => {
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
                    return repository.user.createFromCsv(user).then(res => res).catch(err => err);
                }

                user.photo = await new Promise((resolve, reject) => {
                    return repository.asset.createFromCSVForUsers(assetData).then(res => {
                        resolve(user.photo = res || res.id)
                    })
                })
            }

            user.email = row.email.toLowerCase();
            user.password = row.password || 'Shoclef123'
            user.number = "+" + row.phone_number
            user.name = row.name
            user.Role = row.Role || ["USER"]

            return repository.user.createFromCsv(user)
                .then(res => res)
                .catch(err => {
                    console.log("upload failed index: " + index + "\n", err)
                })
        }).then(res => {
            return res.filter(item => item)
        }).catch(err => {
            return err
        })
    }).then(res => {
        return res
    }).catch(err => {
        return err
    })

}