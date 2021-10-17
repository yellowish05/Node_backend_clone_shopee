const path = require('path');
const uuid = require('uuid/v4');
const repository = require(path.resolve('src/repository'));

const { PurchaseOrderStatus, OrderItemStatus, DeliveryOrderStatus, ShippingRuleType } = require(path.resolve('src/lib/Enums'));

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));
const { getTotalWeight, getTotalPrice } = require('../cart/cartMethods');
const advancedShippingRule = require(path.resolve('src/lib/AdvancedShippingRule'));

async function createOrderItem(cartItem, currency, repository) {
  let price = CurrencyFactory.getAmountOfMoney({
    centsAmount: cartItem.productAttribute ? cartItem.productAttribute.price : cartItem.product.price,
    currency: cartItem.productAttribute ? cartItem.productAttribute.currency : cartItem.product.currency,
  });

  let deliveryPrice = CurrencyFactory.getAmountOfMoney({
    centsAmount: cartItem.shippingRule === ShippingRuleType.SIMPLE ? cartItem.deliveryRate.amount : 0,
    currency: cartItem.deliveryRate.currency,
  });

  if (price.currency !== currency) {
    price = await CurrencyService.exchange(price, currency);
  }

  if (deliveryPrice.currency !== currency) {
    deliveryPrice = await CurrencyService.exchange(deliveryPrice, currency);
  }

  const seller = await repository.user.getById(cartItem.product.seller);

  return {
    status: OrderItemStatus.CREATED,
    createdAt: new Date(),
    product: cartItem.product,
    productAttribute: cartItem.productAttribute,
    quantity: cartItem.quantity,
    originCurrency: cartItem.productAttribute ? cartItem.productAttribute.currency : cartItem.product.currency,
    originPrice: cartItem.productAttribute ? cartItem.productAttribute.price : cartItem.product.price,
    originDeliveryCurrency: cartItem.deliveryRate.currency,
    originDeliveryPrice: cartItem.deliveryRate.amount,
    currency,
    price: price.getCentsAmount(),
    deliveryPrice: deliveryPrice.getCentsAmount() * cartItem.quantity,
    total: price.getCentsAmount() * cartItem.quantity,
    seller: cartItem.product.seller,
    title: cartItem.product.title,
    billingAddress: cartItem.billingAddress,
    note: cartItem.note,
    shippingRule: cartItem.shippingRule,
  };
}

async function createDeliveryOrder(cartItem, currency, priceGroupId = null) {
  let deliveryPrice = CurrencyFactory.getAmountOfMoney({
    centsAmount: cartItem.shippingRule === ShippingRuleType.SIMPLE ? cartItem.deliveryRate.amount * cartItem.quantity : 0,
    currency: cartItem.deliveryRate.currency,
  });

  if (deliveryPrice.currency !== currency) {
    deliveryPrice = await CurrencyService.exchange(deliveryPrice, currency);
  }

  return {
    _id: uuid(),
    status: DeliveryOrderStatus.CREATED,
    createdAt: new Date(),
    seller: cartItem.product.seller,
    rate_id: cartItem.deliveryRate.rate_id,
    estimatedDeliveryDate: cartItem.deliveryRate.estimatedDeliveryDate,
    currency,
    carrier: cartItem.deliveryRate.carrier,
    deliveryAddress: cartItem.deliveryRate.deliveryAddress,
    deliveryPrice: deliveryPrice.getCentsAmount(),
    deliveryAddressInfo: cartItem.deliveryAddress.toObject(),
    shippingRule: cartItem.shippingRule,
    priceGroup: priceGroupId,
  };
}

async function createDeliveryOrders4AdvancedRule(cartItems, currency) {
  const countryMap = cartItems
    .reduce((map, cartItem) => {
      const country = cartItem.deliveryAddress.address.country;
      const countryItems = map[country] || [];
      countryItems.push(cartItem);
      return { ...map, [country]: countryItems };
    }, {});
  return Promise.all(Object.keys(countryMap)
    .map(async country => {
      const countryItems = countryMap[country];
      const weight = getTotalWeight(countryItems);
      const price = await getTotalPrice(countryItems, currency);
      const { shippingFee, handlingFee, days } = await advancedShippingRule({
        weight,
        price,
        countryCode: country,
      });
      // create price group
      const priceGroupId = uuid();
      return Promise.all(countryItems.map(cartItem => createDeliveryOrder(cartItem, currency, priceGroupId)))
        .then(async (deliveryOrders) => {
          const deliveryPriceGroup = await repository.deliveryPriceGroup.create({
            _id: priceGroupId,
            price: shippingFee.getCentsAmount() + handlingFee.getCentsAmount(),
            currency,
            deliveryOrders: deliveryOrders.map(deliveryOrder => deliveryOrder._id),
          });
          return deliveryOrders;
        });
    }))
    .then((deliveryOrderGroups) => deliveryOrderGroups.reduce((orders, orderGroup) => orders.concat(orderGroup), []));
}


class OrderFactory {
  constructor(cartItems, currency, repository) {
    this.cartItems = cartItems;
    this.currency = currency;
    this.purchaseItems = null;
    this.deliveryOrders = null;
    this.deliveryPriceGroups = [];
    this.purchaseOrder = null;
    this.repository = repository;
  }

  setProperties(orderItems, deliveryOrders) {
    this.purchaseItems = orderItems;
    this.deliveryOrders = deliveryOrders;
  }

  async createOrderItems() {
    return Promise.all(
      this.cartItems.map((cartItem) => createOrderItem(cartItem, this.currency, this.repository)),
    )
      .then((purchaseItems) => {
        this.purchaseItems = purchaseItems;
        return purchaseItems;
      });
  }

  async createDeliveryOrders() {
    const deliveryOrders4SimpleRule = await Promise.all(
      this.cartItems
      .filter(cartItem => cartItem.shippingRule === ShippingRuleType.SIMPLE)
      .map((cartItem) => createDeliveryOrder(cartItem, this.currency)),
    )
      .then((deliveryOrders) => {
        this.deliveryOrders = deliveryOrders;
        return deliveryOrders;
      });
    const deliveryOrders4AdvancedRule = await createDeliveryOrders4AdvancedRule(this.cartItems.filter(cartItem => cartItem.shippingRule === ShippingRuleType.ADVANCED), this.currency);
    this.deliveryPriceGroups = await repository.deliveryPriceGroup.getByIds(
      deliveryOrders4AdvancedRule
        .map(order => order.priceGroup)
    );
    return deliveryOrders4SimpleRule.concat(deliveryOrders4AdvancedRule);
  }

  createOrder(customCarrierPrice) {
    const deliveryPrice = this.purchaseItems.reduce((sum, item) => sum + item.deliveryPrice, 0)
      + this.deliveryPriceGroups.reduce((sum, group) => sum + group.price, 0);
    const order = {
      currency: this.currency,
      status: PurchaseOrderStatus.CREATED,
      quantity: this.purchaseItems.reduce((sum, item) => sum + item.quantity, 0),
      price: this.purchaseItems.reduce((sum, item) => sum + item.total, 0),
      deliveryPrice,
      total: this.purchaseItems.reduce((sum, item) => sum + item.total, deliveryPrice + customCarrierPrice),
      tax: 0,
      customCarrierPrice
    };

    return order;
  }
}

module.exports = OrderFactory;
