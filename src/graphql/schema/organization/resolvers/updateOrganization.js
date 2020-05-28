const { UserInputError } = require('apollo-server');
const path = require('path');

const logger = require(path.resolve('config/logger'));
const { providers: { ShipEngine } } = require(path.resolve('src/bundles/delivery'));
const { ForbiddenError } = require('apollo-server');

const activity = {
  async verifyCarriers(ids, repository) {
    if (ids) {
      return Promise.all(ids.map((carrierId) => repository.carrier.getById(carrierId)
        .then((carrier) => {
          if (!carrier) {
            throw new UserInputError(`Carrier ${carrierId} does not exists`, { invalidArgs: 'carriers' });
          }

          return carrier;
        })));
    }
    return Promise.resolve(null);
  },
};

module.exports = async (obj, args, { user, dataSources: { repository } }) => activity.verifyCarriers(args.data.carriers, repository)
  .then(async (carriers) => {
    let address = null;
    if (args.data.address) {
      const addressCountry = await repository.country.getById(args.data.address.country);
      if (!addressCountry) {
        throw new UserInputError('Country does not exists', { invalidArgs: 'address' });
      }
      const addressRegion = await repository.region.getById(args.data.address.region);
      if (!addressRegion) {
        throw new UserInputError('Region does not exists', { invalidArgs: 'address' });
      }

      address = {
        ...args.data.address,
        region: addressRegion,
        country: addressCountry,
      };
      
      // const { status, messages } = await ShipEngine.validate(args.data.address, repository);
      // if (!status) {
      //   throw new UserInputError(messages.length > 0 ? `Seller address is not valid. Reason: ${messages[0]}` : `Seller address is not valid`, { invalidArgs: 'address' });
      // }
      address.isDeliveryAvailable = true;
    }

    let customCarrier;
    if (args.data.customCarrier) {
      customCarrier = await repository.customCarrier.findOrCreate({name: args.data.customCarrier});
      
      if (!customCarrier) {
        throw new ForbiddenError(`Can not find customCarrier with "${args.data.customCarrier}" name`);
      }
    }

    let billingAddress = null;
    if (args.data.billingAddress) {
      const billingAddressCountry = await repository.country.getById(args.data.billingAddress.country);
      if (!billingAddressCountry) {
        throw new UserInputError('Country does not exists', { invalidArgs: 'billingAddress' });
      }

      const billingAddressRegion = await repository.region.getById(args.data.billingAddress.region);
      if (!billingAddressRegion) {
        throw new UserInputError('Region does not exists', { invalidArgs: 'address' });
      }

      billingAddress = {
        ...args.data.billingAddress,
        region: billingAddressRegion,
        country: billingAddressCountry,
      };

      // const { status, messages } = await ShipEngine.validate(args.data.billingAddress, repository);
      // if (!status) {
      //   throw new UserInputError(messages.length > 0 ? `Seller billing Address is not valid. Reason: ${messages[0]}` : `Seller billing Address is not valid`, { invalidArgs: 'billingAddress' });
      // }
      billingAddress.isDeliveryAvailable = true;
    }

    return repository.organization.getByUser(user.id)
      .then((organization) => repository.organization.update(organization, {
        ...args.data,
        owner: user,
        address,
        billingAddress,
        carriers,
        customCarrier:  customCarrier.id || null 
      }));
  });
