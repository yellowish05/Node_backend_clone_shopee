const path = require('path');
const uuid = require('uuid/v4');
const promise = require('bluebird');
const lodash = require('lodash');

const repository = require(path.resolve('src/repository'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const AWS = require('aws-sdk');
const { aws } = require(path.resolve('config'));
const { InventoryLogType } = require(path.resolve('src/lib/Enums'));

const s3 = new AWS.S3();

let shippingBoxesCollection = [];
let products = [];
let brands = [];

const getCSV = async (params) => {
    const csv = await new Promise((resolve, reject) => {
        s3.getObject(params, async (err, data) => {
            const dataRes = await data.Body.toString("UTF-8").split('\n');
            if (err)
                reject(err);
            resolve(dataRes);
        });
    })
    return csv;
}

const pushProducts = async (product) => {
    products.push(product)
}

const pushShippingBoxes = async (shippingBoxes) => {
    shippingBoxesCollection.push(shippingBoxes)
}

const pushBrands = async (brand) => {
    brands.push(brand);
}

const loopProductRows = async (rows, header) => {
    for (const row of rows) {
        if (row !== "") {
            const columns = row.split(',');
            let product = {};

            await columns.forEach((column, colIndex) => {
                if (column !== undefined) {
                    product[header[colIndex]] = column.trim();
                }
            })

            product.seller = await new Promise((resolve, reject) => {
                return repository.user.findByEmail(product.email.toLowerCase()).then(res => {
                    resolve(product.seller = res._id || res);
                }).catch(err => {
                    reject(err)
                })
            })

            product.weight = {
                value: parseInt(product.weightValue),
                unit: product.weightUnit
            }

            let shippingBoxProperties

            try {
                shippingBoxProperties = {
                    label: product.shippingBoxName || "medium",
                    owner: product.seller,
                    width: parseInt(product.shippingBoxWidth),
                    height: parseInt(product.shippingBoxHeight),
                    length: parseInt(product.shippingBoxLength),
                    weight: parseInt(product.weight.value),
                    unit: product.unit,
                    unitWeight: product.unitWeight || "OUNCE"
                }
            } catch (error) {
                console.log("err => ", shippingBoxProperties);
            }

            await pushShippingBoxes(shippingBoxProperties);
            await pushBrands(product.brand_name)
            await pushProducts(product);
        }
    }
}

module.exports = async (_, { fileName }) => {
    const params = {
        Bucket: aws.user_bucket,
        Key: fileName
    }

    const csv = await getCSV(params)
        .then(res => res)
        .catch(err => err);

    let [header, ...rows] = csv;
    header = header.trim().split(',');

    await loopProductRows(rows, header);

    const uniqueShippingBoxes = lodash.uniqWith(shippingBoxesCollection, lodash.isEqual);
    const uniqueBrands = lodash.uniqWith(brands, lodash.isEqual);

    const brandPromises = await uniqueBrands.map(item => new Promise((resolve, reject) => {
        return repository.brand.findOrCreate({ name: item })
            .then(res => {
                resolve(res._id)
            })
            .catch(err => { reject(err) })
    }));

    const shippingBoxesPromises = await uniqueShippingBoxes.map(item => new Promise((resolve, reject) => {
        return repository.shippingBox.findOrAdd({
            label: item.label,
            owner: item.owner,
            width: item.width,
            height: item.height,
            length: item.length,
            weight: item.weight
        }).then(res => {
            resolve(res._id)
        }).catch(err => {
            reject(err)
        })
    }))

    return Promise.all(shippingBoxesPromises, brandPromises).then(async res => {
        let productPromises = await promise.map(products, async (product, index) => {

            product.category = product.categoryID;
            product.description = product.description.split(";").join(',');
            product.title = product.title.split(";").join(',');

            product.seller = await new Promise((resolve, reject) => {
                return repository.user.findByEmail(product.email).then(res => {
                    resolve(product.seller = res._id || res);
                }).catch(err => {
                    reject(err)
                })
            });

            product.assets = [
                product.assets0,
                product.assets1,
                product.assets2,
                product.assets3,
                product.assets4,
                product.assets5,
                product.assets6
            ];

            const path = `/${product.username}/Product Images/`;
            product.assets = await promise.map(product.assets, (asset) => {
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
                    });
                }
            }).then(res => res)
                .catch(err => err)

            product.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: parseInt(product.price), currency: product.currency }).getCentsAmount();
            product.oldPrice = product.oldPrice ? CurrencyFactory.getAmountOfMoney({ currencyAmount: parseInt(product.oldPrice), currency: product.currency }).getCentsAmount() : null;
            product.assets = product.assets.filter(asset => asset) || [];
            product.isDeleted = (product.isDeleted === 'true');

            product.brand = await new Promise((resolve, reject) => {
                return repository.brand.findByName(product.brand_name).then(res => {
                    resolve(product.brand = res.id || res);
                });
            });

            if (!product.freeDeliveryTo) {
                delete product.freeDeliveryTo
            }

            product.weight = {
                value: parseInt(product.weightValue),
                unit: product.weightUnit
            }

            const shippingBoxProperties = {
                label: product.shippingBoxName || "medium",
                owner: product.seller,
                width: parseInt(product.shippingBoxWidth),
                height: parseInt(product.shippingBoxHeight),
                length: parseInt(product.shippingBoxLength),
                weight: parseInt(product.weight.value),
                unit: product.unit,
                unitWeight: product.unitWeight || "OUNCE"
            }

            product.customCarrier = await new Promise((resolve, reject) => {
                return repository.customCarrier.getById(product.customCarrier).then(res => {
                    resolve(product.customCarrier = res._id || res)
                }).catch(err => {
                    reject(err);
                })
            })

            product.customCarrierValue = parseFloat(product.customCarrierValue);
            product.customCarrierValue = CurrencyFactory.getAmountOfMoney({ currencyAmount: parseFloat(product.customCarrierValue), currency: product.currency }).getCentsAmount();

            product.shippingBox = await new Promise((resolve, reject) => {
                return repository.shippingBox.findByOwnerAndSize({
                    label: shippingBoxProperties.label,
                    owner: shippingBoxProperties.owner,
                    width: shippingBoxProperties.width,
                    height: shippingBoxProperties.height,
                    length: shippingBoxProperties.length,
                    weight: shippingBoxProperties.weight
                }).then(res => {
                    resolve(product.shippingBox = res._id || res)
                }).catch(err => {
                    reject(err);
                });
            });

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

            repository.productInventoryLog.add(inventoryLog);

            return await repository.product.create(product).then(res => res);
        })
            .then(res => res.filter(item => item))
            .catch(err => err)

        return productPromises;
    })
        .then(res => {
            products = [];
            return res
        })
        .catch(err => err);
}