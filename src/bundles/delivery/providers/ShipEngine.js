const path = require('path');
const axios = require('axios');

const logger = require(path.resolve('config/logger'));
const { shipengine } = require(path.resolve('config'));

if (shipengine.api_key == null) {
  logger.warn("You didn't provided API_KEY for ShipEngine. You will not be able to work with shipping");
}

module.exports = {
  validate(address, repository) {
    return repository.addressVerificationCache.get(address)
      .then((cache) => {
        if (cache) {
          return { status: cache.verified, messages: cache.messages };
        }

        const headers = {
          'Content-Type': 'application/json',
          'API-Key': shipengine.api_key,
        };

        const body = [{
          address_line1: address.street,
          city_locality: address.city,
          state_province: address.region,
          postal_code: address.zipCode,
          country_code: address.country,
        }];

        return axios.post(`${shipengine.uri}/addresses/validate`, body, { headers })
          .then(({ data }) => {
            const result = data[0];
            const status = result.status === 'verified' || result.status === 'warning';
            const messages = result.messages.filter((m) => m.type === 'error').map((m) => m.message);
            repository.addressVerificationCache.create({
              verified: status,
              messages,
              address,
            }).then((addressCache) => {
              logger.info(`New Address Verification added to cache: ${JSON.stringify(addressCache)}`);
            }).catch((error) => {
              logger.error(`Failed to cache Address Vrification. Original error: ${error.message}`);
            });

            return { status, messages };
          })
          .catch((error) => {
            logger.error(`Error happend while validation address through Ship Engine. Original error: ${error.message}`);
          });
      });
  },
};
