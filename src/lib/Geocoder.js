const NodeGeocoder = require('node-geocoder');
const { geocoder } = require('../../config');
const logger = require('../../config/logger');

const provider = 'google';

if (geocoder[provider].api_key == null) {
  logger.warn("You didn't provided API_KEY for Google Geocoder. You will not be able to decode latitude longitude");
}

const options = {
  provider,
  apiKey: geocoder[provider].api_key,
  formatter: null,
};

const geocoderService = NodeGeocoder(options);

module.exports.Geocoder = {
  reverse(location) {
    return geocoderService.reverse({ lat: location.latitude, lon: location.longitude })
      .then((res) => ({
        country: {
          id: res[0].countryCode.toUpperCase(),
          name: res[0].country,
        },
        label: res[0].streetNumber,
        street: res[0].streetName,
        city: res[0].city,
        zipCode: res[0].zipcode,
      }));
  },

  geocode(address) {
    const addressArray = [];
    if (address.label) {
      addressArray.push(address.label);
    }
    if (address.street) {
      addressArray.push(address.street);
    }
    if (address.city) {
      addressArray.push(address.city);
    }

    const query = {
      address: addressArray.join(' '),
      zipcode: address.zipCode,
    };

    if (address.region) {
      query.county = address.region.name;
    }

    if (address.country) {
      query.country = address.country.name;
    }

    return geocoderService.geocode(query)
      .then((res) => ({ latitude: res[0].latitude, longitude: res[0].longitude }));
  },
};
