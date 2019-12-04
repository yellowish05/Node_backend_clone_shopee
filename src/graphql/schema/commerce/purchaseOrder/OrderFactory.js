const path = require('path');

const { PurchaseOrderStatus, OrderItemStatus } = require(path.resolve('src/lib/Enums'));

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { CurrencyService } = require(path.resolve('src/lib/CurrencyService'));

async function createOrderItem(cartItem, currency) {
  let price = CurrencyFactory.getAmountOfMoney({
    centsAmount: cartItem.product.price,
    currency: cartItem.product.currency,
  });

  if (price.currency !== currency) {
    price = await CurrencyService.exchange(price, currency);
  }

  return {
    status: OrderItemStatus.CREATED,
    createdAt: new Date(),
    product: cartItem.product,
    quantity: cartItem.quantity,
    originCurrency: cartItem.product.currency,
    originPrice: cartItem.product.price,
    currency,
    price: price.getCentsAmount(),
    total: price.getCentsAmount() * cartItem.quantity,
    seller: cartItem.product.seller,
    title: cartItem.product.title,
  };
}


class OrderFactory {
  constructor(cartItems, currency) {
    this.cartItems = cartItems;
    this.currency = currency;
    this.purchaseItems = null;
    this.purchaseOrder = null;
  }

  async createOrderItems() {
    return Promise.all(
      this.cartItems.map((cartItem) => createOrderItem(cartItem, this.currency)),
    )
      .then((purchaseItems) => {
        this.purchaseItems = purchaseItems;
        return purchaseItems;
      });
  }

  createOrder() {
    const order = {
      currency: this.currency,
      status: PurchaseOrderStatus.CREATED,
      quantity: this.purchaseItems.reduce((sum, item) => sum + item.quantity, 0),
      total: this.purchaseItems.reduce((sum, item) => sum + item.total, 0),
    };

    return order;
  }
}

module.exports = OrderFactory;
