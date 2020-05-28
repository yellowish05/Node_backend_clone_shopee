const path = require('path');
const axios = require('axios');
const EasyPost = require('@easypost/api');
const logger = require(path.resolve('config/logger'));
const { easyPost } = require(path.resolve('config'));
const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { Currency } = require(path.resolve('src/lib/Enums'));

if (easyPost.api_key == null) {
  logger.warn("You didn't provided API_KEY for EasyPost. You will not be able to work with shipping");
}

const api = new EasyPost(easyPost.api_key);

class EasyPostClass {

  formatEasyPostErrors(code, message, errors) {
    let error = '';
    errors.map(({ field, message }) => error += `Field "${field}" ${message}. `)
    return `${code} - ${message} ${error}`;
  }

  async addParcel(data) {
    /*     let addresses = await axios.get(`${easyPost.uri}/addresses`, {
          headers: {
            "Authorization": 'Basic RVpUS2M2MjYzMDhjOTk2MjRiZDVhZDEyMjczNDIyYzI1YmZjRWJ3WWZ3UmhEN2k3ZDhhYXlobWM2Zzo='
            // production key: RVpBS2M2MjYzMDhjOTk2MjRiZDVhZDEyMjczNDIyYzI1YmZjR0FWREVodEJYeGZsSEhwYUJ0NGNBZzo=
            // test key: RVpUS2M2MjYzMDhjOTk2MjRiZDVhZDEyMjczNDIyYzI1YmZjRWJ3WWZ3UmhEN2k3ZDhhYXlobWM2Zzo=
          }
        })
        console.log("addresses =========================== length: ", addresses.data.addresses.length, addresses.data.addresses)
        return; */
    let length = data.length;
    let width = data.width;
    let height = data.height;
    if (data.unit == 'CENTIMETER') {
      length = data.length / 2.54; // default unit for dimensions in EasyPost is INCH
      width = data.width / 2.54;
      height = data.height / 2.54;
    }
    let weight = data.unitWeight == 'OUNCE' ? data.weight : data.weight / 28.35; // default unit for weight in EasyPost is OUNCE
    const parcel = new api.Parcel({
      length,
      width,
      height,
      weight
    });
    return parcel.save().then(response => response).catch(({ error: { error: { code, message, errors } } }
    ) => {
      let errorMessage = this.formatEasyPostErrors(code, message, errors);
      logger.error(`Error happened while adding a parcel in Easy Post. Original error: ${errorMessage}`);
      throw new Error(errorMessage);
    });
  }

  async addAddress({ phone, email, address }) {
    const addressData = new api.Address({
      verify_strict: [
        "delivery"
      ],
      street1: address.street,
      city: address.city,
      state: address.region,
      zip: address.zipCode || null,
      country: address.country,
      phone: phone || null,
      email: email || null
    });
    return addressData.save().then(response => response).catch(({ error: { error: { code, message, errors } } }
    ) => {
      let errorMessage = this.formatEasyPostErrors(code, message, errors);
      logger.error(`Error happened while adding address in Easy Post. Original error: ${errorMessage}`);
      throw new Error(errorMessage);
    })
  }
}

module.exports = new EasyPostClass();
