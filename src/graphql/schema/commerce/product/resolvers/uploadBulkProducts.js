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
let failedParsing = [];
let failedProducts = [];
let brands = [];
let assetsS3bucket;

const getDataFromCsv = async (params) => {
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

const addProduct = async (product, index) => {
    product.category = product.categoryID;
    product.description = product.description.split(";").join(',');
    product.title = product.title.split(";").join(',');

    product.seller = await new Promise((resolve) => {
        return repository.user.findByEmail(product.email).then(res => {
            resolve(product.seller = res._id || res);
        }).catch(() => {
            resolve(null);
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
                url: aws.vender_bucket,
                bucket: assetsS3bucket
            }

            return repository.asset.createFromCSVForProducts(assetData).then(res => {
                return res.id || res;
            });
        }
    }).then(res => res)
        .catch(err => err)

    const price = parseFloat(product.price);
    const oldPrice = product.oldPrice ? parseFloat(product.oldPrice) : parseFloat(product.price);

    product.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: price, currency: product.currency }).getCentsAmount();
    product.oldPrice = product.oldPrice ? CurrencyFactory.getAmountOfMoney({ currencyAmount: oldPrice, currency: product.currency }).getCentsAmount() : null;
    product.assets = product.assets.filter(asset => asset) || [];
    product.isDeleted = (product.isDeleted === 'true');

    product.brand = await new Promise((resolve) => {
        return repository.brand.findByName(product.brand_name).then(res => {
            resolve(res.id || res);
        }).catch(() => {
            resolve(null);
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
        weight: product.weight.value,
        unit: product.weight.unit,
        unitWeight: product.unitWeight || "OUNCE"
    }

    product.shippingBox = await new Promise((resolve) => {
        return repository.shippingBox.findByOwnerAndSize({
            label: shippingBoxProperties.label,
            owner: shippingBoxProperties.owner,
            width: shippingBoxProperties.width,
            height: shippingBoxProperties.height,
            length: shippingBoxProperties.length,
            weight: shippingBoxProperties.weight
        }).then(res => {
            resolve(res._id || res);
        }).catch(() => {
            resolve(null);
        });
    });

    product.customCarrier = await new Promise((resolve) => {
        return repository.customCarrier.getById(product.customCarrier).then(res => {
            resolve(product.customCarrier = res._id || res)
        }).catch(() => {
            resolve(undefined);
        })
    })

    product.customCarrierValue = CurrencyFactory.getAmountOfMoney({ currencyAmount: parseFloat(product.customCarrierValue), currency: product.currency }).getCentsAmount();

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

    return await repository.product.createFromCSV(product).then(res => {
        repository.productInventoryLog.add(inventoryLog);
        return res
    }).catch((err) => {
        const error = errorFormater(err, (index + 2));
        pushFailedProducts({ csvPosition: (index + 2), error: error, ...product });
    });
}

const errorFormater = (err, row) => {
    const error = err.errors;
    let parsedError = [];

    if (error.price) {
        parsedError = error.price.message;
    } else if (error.customCarrierValue) {
        parsedError = error.customCarrierValue.message;
    } else if (error.currency) {
        parsedError = error.customCarricurrencyValue.message;
    } else if (error.customCarrier) {
        parsedError = error.customCarrier.message;
    } else if (error.shippingBox) {
        parsedError = error.shippingBox.message;
    } else if (error.brand) {
        parsedError = error.brand.message;
    } else if (error.seller) {
        parsedError = error.seller.message;
    } else if (error.description) {
        parsedError = error.description.message;
    } else if (error.message) {
        parsedError = error;
    } else {
        parsedError = "no mesage"
    }

    parsedError += " on row " + row;

    return parsedError;
}

const pushFailedProducts = async (failedProduct) => {
    failedProducts.push(failedProduct);
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
    let index = 0;
    for (const row of rows) {
        index++;
        if (row !== "") {
            const columns = row.split(',');
            let product = {};

            await columns.forEach((column, colIndex) => {
                if (column !== undefined) {
                    product[header[colIndex]] = column.trim();
                }
            })

            const email = product.email ? product.email.toLowerCase() : 'null';
            product.seller = await new Promise((resolve) => {
                return repository.user.findByEmail(email).then(res => {
                    resolve(res._id || res);
                }).catch(() => {
                    failedParsing.push(`While reading the csv could not find seller ${index}`);
                    resolve(undefined);
                })
            })

            product.weight = {
                value: product.weightValue,
                unit: product.weightUnit
            }

            let shippingBoxProperties

            try {
                if (!product.seller)
                    throw err;

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
                failedParsing.push("Couldn't parse shippingBox properties");
            }

            await pushShippingBoxes(shippingBoxProperties);
            await pushBrands(product.brand_name)
            await pushProducts(product);
        }
    }
}

module.exports = async (_, { fileName, bucket }) => {
    assetsS3bucket = bucket;
    const params = {
        Bucket: aws.user_bucket,
        Key: fileName
    }

    const csv = await getDataFromCsv(params)
        .then(res => res)
        .catch(err => err);

    let [header, ...rows] = csv;
    header = header.trim().split(',');

    await loopProductRows(rows, header);

    const uniqueShippingBoxes = lodash.uniqWith(shippingBoxesCollection, lodash.isEqual);
    const uniqueBrands = lodash.uniqWith(brands, lodash.isEqual);

    const brandPromises = await uniqueBrands.map(item => new Promise((resolve) => {
        return repository.brand.findOrCreate({ name: item })
            .then(res => {
                resolve(res._id)
            })
            .catch(() => {
                failedParsing.push("Couldn't add/parse brand");
                resolve(null);
            })
    }));

    const shippingBoxesPromises = await uniqueShippingBoxes.map(item => new Promise((resolve) => {
        return repository.shippingBox.findOrAdd({
            label: item.label,
            owner: item.owner,
            width: item.width,
            height: item.height,
            length: item.length,
            weight: item.weight,
            unit: item.unit,
            unitWeight: item.unitWeight
        }).then(res => {
            resolve(res._id)
        }).catch(() => {
            failedParsing.push("couldn't add/parse shippingbox");
            resolve(null);
        })
    }));

    return Promise.all(shippingBoxesPromises, brandPromises).then(async () => {
        if (failedParsing.length === 0) {
            const productPromises = await promise.map(products, async (product, index) => {
                return await addProduct(product, index)
            }).then(res => res.filter(item => item))
                .catch(err => err)

            return productPromises;
        } else {
            throw failedParsing;
        }
    }).then((res) => {
        const failed = failedProducts.map(prod => {
            rolleBackAssets(prod.assets);
            return prod.csvPosition
        });

        const error = failedProducts.map(prod => {
            return prod.error;
        })

        failedProducts = [];
        products = [];
        return {
            success: res,
            failedProducts: { row: [...failed], errors: error },
            totalProducts: res.length + failed.length,
            uploaded: res.length,
            failed: failed.length
        };
    }).catch(() => {

        const failedParsingConst = failedParsing.map(prod => prod.trim());
        failedParsing = [];
        return {
            success: [],
            failedProducts: { row: [-1], errors: [...failedParsingConst] },
            totalProducts: -1,
            uploaded: 0,
            failed: -1
        }
    });
}

const rolleBackAssets = async (assets) => {
    assets.forEach(asset => {
        if (asset) {
            repository.asset.deleteAsset({ id: asset }).then(res => res).catch((err) => err);
        }
    })
}