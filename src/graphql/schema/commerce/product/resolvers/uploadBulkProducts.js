const path = require('path');
const uuid = require('uuid/v4');
const promise = require('bluebird');

const repository = require(path.resolve('src/repository'));
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
                        product[headers[colIndex].trim()] = column.trim();
                    })

                    product.category = product.category_UID;
                    product.description = product.description.split("/").join(',');

                    product.title = product.title.split("/").join(',');
                    product.seller = await new Promise((resolve, reject) => {
                        return repository.user.findByEmail(product.User_Email).then(res => {
                            resolve(product.seller = res._id || res);
                        })
                    })

                    product.assets = [
                        product.assets0,
                        product.assets1,
                        product.assets2,
                    ]

                    let path = `/${product.User_Name}/Product Images/`;
                    product.assets = await promise.map(product.assets, (asset, index) => {
                        if (asset !== "") {

                            const assetData = {
                                owner: product.seller,
                                path: `${path}${asset}`,
                                photo: asset,
                                name: product.User_Name,
                                url: aws.vender_bucket
                            }

                            return repository.asset.createFromCSVForProducts(assetData).then(res => {
                                return res.id || res;
                            })

                        }
                    }).then(res => res)

                    product.assets = product.assets.filter(asset => asset);

                    product.isDeleted = (product.isDeleted === 'true');

                    product.brand = await new Promise((resolve, reject) => {
                        return repository.brand.findOrCreate({ name: product.brand_name.trim() }).then(res => {
                            resolve(product.brand = res.id || res);
                        })
                    })

                    product.weight = {
                        value: parseInt(product.weight_value),
                        unit: product.weight_unit
                    }

                    const shippingBoxProperties = {
                        label: product.shippingBoxName || "null",
                        owner: product.seller,
                        width: product.shippingBox_width,
                        height: product.shippingBox_height,
                        length: product.shippingBox_length,
                        unit: product.unit,
                    }

                    product.shippingBox = await new Promise((resolve, reject) => {
                        return repository.shippingBox.findOrAdd(shippingBoxProperties).then(res => {
                            resolve(product.shippingBox = res.id || res)
                        })
                    })

                    const {
                        assets_0,
                        assets_1,
                        assets_2,
                        weight_value,
                        shippingBoxName,
                        shippingBox_width,
                        shippingBox_height,
                        shippingBox_length,
                        unit,
                        weight_unit,
                        ...finalProduct
                    } = product;

                    product = { _id: uuid(), ...finalProduct };

                    const inventoryLog = {
                        _id: uuid(),
                        product: product._id,
                        shift: product.Quantity,
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