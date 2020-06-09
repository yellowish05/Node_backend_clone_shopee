const path = require('path');
const uuid = require('uuid/v4');
const promise = require('bluebird');

const repository = require(path.resolve('src/repository'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const AWS = require('aws-sdk');
const { aws } = require(path.resolve('config'));
const csv = require('csvtojson');

const { InventoryLogType } = require(path.resolve('src/lib/Enums'));

const s3 = new AWS.S3();

module.exports = async (_, { fileName }, data) => {
    const params = {
        Bucket: aws.user_bucket,
        Key: fileName
    }

    return new Promise((resolve, reject) => {
        const stream = s3.getObject(params).createReadStream();

        const json = csv().fromStream(stream);

        resolve(json);
    }).then(data => {
        return promise.map(data, async (row, index) => {
            let product = {};

            product.category = row.category_UID;
            product.description = row.description.split("/").join(',');
            product.title = row.title.split("/").join(',');
            if (row.prod_user_UID) {
                product.seller = row.prod_user_UID;
            } else {
                product.seller = await new Promise((resolve, reject) => {
                    return repository.user.findByEmail(row.User_Email.toLowerCase()).then(res => {
                        if (res == null) {
                            resolve(null);
                        } else {
                            resolve(res._id || res);
                        }
                    });
                });
            }

            product.assets = [
                row.assets_0,
                row.assets_1,
                row.assets_2,
                row.assets_3,
            ];

            let path = `/${row.User_Name}/Product Images/`;
            product.assets = await promise.map(product.assets, (asset, index) => {
                if (asset !== "") {

                    const assetData = {
                        owner: product.seller,
                        path: `${path}${asset}`,
                        photo: asset,
                        name: row.User_Name,
                        url: aws.vendor_bucket
                    }

                    return repository.asset.createFromCSVForProducts(assetData).then(res => {
                        if (res == null) {
                            return null;
                        }
                        return res.id || res;
                    })

                }
            }).then(res => res)

            product.currency = row.currency;
            row.price = Number(row.price);
            row.oldPrice = Number(row.oldPrice);
            product.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: row.price, currency: row.currency }).getCentsAmount();
            product.oldPrice = CurrencyFactory.getAmountOfMoney({ currencyAmount: row.oldPrice, currency: row.currency }).getCentsAmount();
            product.assets = product.assets.filter(asset => asset);
            product.isDeleted = (row.isDeleted === 'true');

            if (row.brand_name) {
                product.brand = await new Promise((resolve, reject) => {
                    return repository.brand.findOrCreate({ name: row.brand_name.trim() }).then(res => {
                        resolve(res.id || res);
                    })
                });
            }

            product.weight = {
                value: parseInt(row.weight_value),
                unit: row.weight_unit
            };

            const shippingBoxProperties = {
                parcelId: row.parcelId || "parcel",
                weight: row.weight_value,
                unitWeight: row.weight_unit,
                label: row.shippingBoxName || "null",
                owner: product.seller,
                width: row.shippingBox_width,
                height: row.shippingBox_height,
                length: row.shippingBox_length,
                unit: row.unit,
            };

            product.shippingBox = await new Promise((resolve, reject) => {
                return repository.shippingBox.findOrAdd(shippingBoxProperties).then(res => {
                    resolve(res.id || res);
                }).catch(err => {
                    console.log("upload failed index: " + index + "\n", err)
                    resolve(null);
                });
            });

            product.freeDeliveryTo = row.freeDeliveryTo || [];
            product._id = uuid();

            const inventoryLog = {
                _id: uuid(),
                product: product._id,
                shift: row.Quantity,
                type: InventoryLogType.USER_ACTION,
            };

            repository.productInventoryLog.add(inventoryLog);

            return repository.product.create(product)
                .then(res => res)
                .catch(err => {
                    console.log("upload failed index: " + index + "\n", err)
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