const path = require('path');
const uuid = require('uuid/v4');
const promise = require('bluebird');

const repository = require(path.resolve('src/repository'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));

const AWS = require('aws-sdk');
const { aws, cdn } = require(path.resolve('config'));
const csv = require('csvtojson');

const { InventoryLogType } = require(path.resolve('src/lib/Enums'));

const s3 = new AWS.S3();

module.exports = async (_, { fileName }, data) => {
    console.log(fileName);
    const params = {
        Bucket: aws.user_bucket,
        Key: fileName
    }

    return new Promise((resolve, reject) => {
        const stream = s3.getObject(params).createReadStream();

        const json = csv().fromStream(stream);

        resolve(json);
        
    }).then(data => {
        console.log(data);
        return JSON.stringify(data);
        // return promise.map(data, async (row, index) => {
        //     let product = {};

        //     product.category = row.category_UID;
        //     product.description = row.description.split("/").join(',');
        //     product.title = row.title.split("/").join(',');
        //     product.seller = {
        //         name: row.User_Name,
        //         email: row.User_Email
        //     }
        //     console.log(123);

        //     product.assets = [
        //         row.assets_0,
        //         row.assets_1,
        //         row.assets_2,
        //         row.assets_3,
        //     ];

        //     product.assets = await promise.map(product.assets, (asset, index) => {
        //         if (asset !== "") {
        //             const url = `${cdn.vendorBuckets}/${row.User_Name}/Product Images/${asset}`;

        //             return url;
        //         } else {
        //             return null;
        //         }
        //     });

        //     product.currency = row.currency;
        //     row.price = Number(row.price);
        //     row.oldPrice = Number(row.oldPrice);
        //     product.price = CurrencyFactory.getAmountOfMoney({ currencyAmount: row.price, currency: row.currency }).getCentsAmount();
        //     product.oldPrice = CurrencyFactory.getAmountOfMoney({ currencyAmount: row.oldPrice, currency: row.currency }).getCentsAmount();
        //     product.assets = product.assets.filter(asset => asset);
        //     product.isDeleted = (row.isDeleted === 'true');
        //     product.brand_name = row.brand_name
        //     product.weight = {
        //         value: parseInt(row.weight_value),
        //         unit: row.weight_unit
        //     };
        //     console.log(456);
        //     product.shippingBox = {
        //         parcelId: row.parcelId || "parcel",
        //         weight: row.weight_value,
        //         unitWeight: row.weight_unit,
        //         label: row.shippingBoxName || "null",
        //         owner: product.seller,
        //         width: row.shippingBox_width,
        //         height: row.shippingBox_height,
        //         length: row.shippingBox_length,
        //         unit: row.unit,
        //     }
        //     product.freeDeliveryTo = row.freeDeliveryTo || [];
        //     console.log(789);
        //     product.quantity = row.quantity;
            
        //     return product;
        // }).then(res => {
        //     return res.filter(item => item);
        // }).catch(err => {
        //     return err;
        // })
    }).catch(err => {
        return err;
    })
}