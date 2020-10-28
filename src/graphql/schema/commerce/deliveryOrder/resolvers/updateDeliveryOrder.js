const path = require('path');
const { Validator } = require('node-input-validator');

const { DeliveryOrderStatus } = require(path.resolve('src/lib/Enums'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (_, { id, data }, { dataSources: { repository }, user }) => {
    const validator = new Validator({ ...data, id }, {
        id: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
        trackingNumber: 'required',
        carrierId: ['required', ['regex', '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}']],
        deliveryPrice: 'required|decimal',
        estimatedDeliveryDate: 'required',
        currency: 'required',
    });

    let deliveryOrder;

    validator.addPostRule(async (provider) => Promise.all([
        repository.deliveryOrder.getById(provider.inputs.id),
        repository.carrier.getById(provider.inputs.carrierId)
    ])
    .then(([foundDeliveryOrder, foundCarrier]) => {
        if (!foundDeliveryOrder) {
            provider.error('id', 'custom', `DeliveryOrder with id "${provider.inputs.id}" doen not exist!`);
        }
        if (!foundCarrier) {
            provider.error('carrier', 'custom', `Carrier with id "${provider.inputs.carrierId}" doen not exist!`);
        }
        deliveryOrder = foundDeliveryOrder;
    }));

    return validator.check()
        .then(async (matched) => {
            if (!matched) {
                throw errorHandler.build(validator.errors);
            }
        })
        .then(async () => {
            deliveryOrder.trackingNumber = data.trackingNumber;
            deliveryOrder.carrier = data.carrierId;
            deliveryOrder.status = DeliveryOrderStatus.SHIPPED;
            deliveryOrder.estimatedDeliveryDate = data.estimatedDeliveryDate;
            deliveryOrder.proofPhoto = data.proofPhoto;
            deliveryOrder.deliveryPrice = data.deliveryPrice;
            deliveryOrder.currency = data.currency;

            return Promise.all([
                deliveryOrder.save()
            ])
              .then(async ([updatedDeliveryOrder]) => {
                  
                  return updatedDeliveryOrder;
              })
        });
}