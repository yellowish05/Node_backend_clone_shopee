const path = require('path');
const uuid = require('uuid/v4');
const promise = require('bluebird');

const repository = require(path.resolve('src/repository'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const AWS = require('aws-sdk');
const { aws } = require(path.resolve('config'));
const { InventoryLogType } = require(path.resolve('src/lib/Enums'));

const s3 = new AWS.S3();

module.exports = async (_, { fileName }, data) => {
    const params = {
        Bucket: aws.user_bucket,
        Key: fileName
    }

    return await new Promise((resolve, reject) => {
        s3.getObject(params, async (err, data) => {
            const csv = data.Body.toString("UTF-8").split('\n');
            const headers = csv[0].split(',');

            await promise.map(csv, async (row, index) => {
                if (index > 0) {
                    const columns = row.split(',');
                    let product = {};

                    columns.forEach((column, colIndex) => {
                        if (column !== undefined) {
                            product[headers[colIndex].trim()] = column.trim();
                        }
                    })

                    product.category = product.categoryID;
                    product.description = product.description.split(";").join(',');
                    product.title = product.title.split(";").join(',');

                    product.seller = await new Promise((resolve, reject) => {
                        return repository.user.findByEmail(product.email).then(res => {
                            resolve(product.seller = res._id || res);
                        })
                    })

                    product.assets = [
                        product.assets0,
                        product.assets1,
                        product.assets2,
                    ]

                    const path = `/${product.username}/Product Images/`;
                    product.assets = await promise.map(product.assets, (asset, index) => {
                        if (asset !== "") {
                            const assetData = {
                                owner: product.seller,
                                path: `${path}${asset}`,
                                photo: asset,
                                name: product.username,
                                url: aws.vender_bucket
                            }

                            return repository.asset.createFromCSVForProducts(assetData).then(res => {
                                return res.id || res;
                            })
                        }
                    }).then(res => res)

                    product.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: parseInt(product.price), currency: product.currency }).getCentsAmount();
                    product.oldPrice = product.oldPrice ? CurrencyFactory.getAmountOfMoney({ currencyAmount: parseInt(product.oldPrice), currency: product.currency }).getCentsAmount() : null;
                    product.assets = product.assets.filter(asset => asset);
                    product.isDeleted = (product.isDeleted === 'true');

                    product.brand = await new Promise((resolve, reject) => {
                        return repository.brand.findOrCreate({ name: product.brandname.trim() }).then(res => {
                            resolve(product.brand = res.id || res);
                        })
                    })

                    product.weight = {
                        value: parseInt(product.weightValue),
                        unit: product.weightUnit
                    }

                    const shippingBoxProperties = {
                        label: product.shippingBoxName || "medium",
                        owner: product.seller,
                        width: parseInt(product.shippingBoxWidth) || 15,
                        height: parseInt(product.shippingBoxHeight) || 15,
                        length: parseInt(product.shippingBoxLength) || 15,
                        weight: parseInt(product.weight.value) || 20,
                        unit: product.unit,
                        unitWeight: product.unitWeight || "OUNCE"
                    }

                    product.shippingBox = await new Promise((resolve, reject) => {
                        return repository.shippingBox.findByOwnerAndSize({
                            owner: shippingBoxProperties.owner,
                            width: shippingBoxProperties.width,
                            height: shippingBoxProperties.height,
                            length: shippingBoxProperties.length,
                            weight: shippingBoxProperties.weight
                        })
                            .then(res => {
                                resolve(product.shippingBox = res._id || res)
                            })
                    })

                    const {
                        id,
                        assets0,
                        assets1,
                        assets2,
                        weightValue,
                        shippingBoxName,
                        shippingBoxWidth,
                        shippingBoxHeight,
                        shippingBoxLength,
                        unit,
                        weightUnit,
                        ...finalProduct
                    } = product;

                    if (id) {
                        product = { _id: id, ...finalProduct };
                    } else {
                        product = { _id: uuid(), ...finalProduct };
                    }

                    const inventoryLog = {
                        _id: uuid(),
                        product: product._id,
                        shift: product.quantity,
                        type: InventoryLogType.USER_ACTION,
                    };

                    repository.productInventoryLog.add(inventoryLog)
                    if (err)
                        reject(err);

                    return repository.product.create(product).then(res => res);
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