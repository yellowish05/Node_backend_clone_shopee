const path = require('path');
const { gql } = require('apollo-server');

const { CurrencyFactory } = require(path.resolve('src/lib/CurrencyFactory'));
const { InvoiceService } = require(path.resolve('src/lib/InvoiceService'));

const checkoutCart = require('./resolvers/checkoutCart');
const checkoutOneProduct = require('./resolvers/checkoutOneProduct');
const payPurchaseOrder = require('./resolvers/payPurchaseOrder');
const purchaseOrders = require('./resolvers/purchaseOrders');
const invoiceService = require('../../../../bundles/invoice');

const { PaymentMethodProviders } = require(path.resolve('src/lib/Enums'));
const { PurchaseOrderStatus } = require(path.resolve('src/lib/Enums'));
const LinePayConfirm = require(path.resolve('src/bundles/payment/providers/LinePay/LinePayConfirm'));

const schema = gql`
    enum PurchaseOrderStatus {
        ${PurchaseOrderStatus.toGQL()}
    }

    enum PaymentMethodProviders {
      ${PaymentMethodProviders.toGQL()}
    }

    """ Orders for Buyer """
    type PurchaseOrder {
        id: ID!
        isPaid: Boolean!
        """ Collected status """
        status: PurchaseOrderStatus!
        """ List of products or services or anything else what we going to selling """
        #items: [OrderItemInterface!]! # old way
        items: [OrderProductItem!]!
        """ In Cents, Amount of money Shoclef will charge from Buyer"""
        price: AmountOfMoney!
        """ In Cents, Amount of money Shoclef will charge from Buyer"""
        deliveryPrice: AmountOfMoney!
        """ In Cents, Amount of money Shoclef will charge from Buyer"""
        total: AmountOfMoney!
        tax: AmountOfMoney!
        """ In future buyer will be able to pay by few paymnets to one Order"""
        payments: [PaymentTransactionInterface!]
        """ Address for ship products """
        deliveryOrders: [DeliveryOrder]!
        cancelationReason: String
        error: String
        publishableKey: String
        paymentClientSecret: String
        buyer: User!
        createdAt: Date!
        paymentInfo: String
    }

    type PurchaseOrderCollection {
        collection: [PurchaseOrder]!
        pager: Pager
    }

    type ConfirmMessage {
      message: String!
    }

    input PurchaseOrderFilterInput {
      statuses: [PurchaseOrderStatus!]
    }

    input RedirectionInput {
      success: String!
      cancel: String
    }

    enum PurchaseOrderSortFeature {
      CREATED_AT
    }

    input PurcahseOrderSortInput {
      feature: ReviewSortFeature! = CREATED_AT
      type: SortTypeEnum! = DESC
    }

    extend type Query {
        allPurchaseOrders: [PurchaseOrder]!
        purchaseOrders(filter: PurchaseOrderFilterInput = {}, sort: PurcahseOrderSortInput = {}, page: PageInput = {}): PurchaseOrderCollection!  @auth(requires: USER)
        purchaseOrder(id: ID!): PurchaseOrder
        getInvoicePDF(id: ID!): String
    }

    extend type Mutation {
        """
          - Allows: authorized user
          - param.redirection: requires only for PayPal
        """
        checkoutCart(currency: Currency!, provider: PaymentMethodProviders!, redirection: RedirectionInput): PurchaseOrder! @auth(requires: USER)

        """
          - Allows: authorized user
          - redirection: required for PayPal or UnionPay
        """
        checkoutOneProduct(
          deliveryRate: ID!, 
          product: ID!, 
          quantity: Int!, 
          currency: Currency!, 
          productAttribute: ID, 
          provider: PaymentMethodProviders!,
          billingAddress: ID!,
          redirection: RedirectionInput
        ): PurchaseOrder! @auth(requires: USER)

        """Allows: authorized user"""
        cancelPurchaseOrder(id: ID!, reason: String!): PurchaseOrder! @auth(requires: USER)

        """Allows: authorized user"""
        LinePayConfirm(transactionID: String!, amount: Float!, currency: Currency!): ConfirmMessage! @auth(requires: USER)

        """
        Allows: authorized user
        Pass ID of the Order you want to pay
        """
        payPurchaseOrder(id: ID!, paymentMethod: ID): PaymentTransactionInterface! @auth(requires: USER)
    }

    
`;

module.exports.typeDefs = [schema];

module.exports.resolvers = {
  Query: {
    allPurchaseOrders: async (_, __, { dataSources: { repository }, user }) => (
      repository.purchaseOrder.find({ user })
        .then((collection) => (collection || []))
    ),
    purchaseOrder: async (_, { id }, { dataSources: { repository } }) => (
      repository.purchaseOrder.getById(id)
    ),
    purchaseOrders,
    getInvoicePDF: async (_, { id }, { dataSources: { repository } }) => repository.purchaseOrder.getInvoicePDF(id)
      .then((pdf) => {
        if (pdf && pdf.length > 0) {
          return pdf;
        }

        return InvoiceService.getOrderDetails(id)
          .then(async (orderDetails) => InvoiceService.createInvoicePDF(orderDetails))
          .catch((err) => {
            throw new Error(err.message);
          });
    }),
  },
  Mutation: {
    checkoutCart,
    checkoutOneProduct,
    payPurchaseOrder,
    LinePayConfirm,
  },
  PurchaseOrder: {
    items: async (order, _, { dataSources: { repository } }) => (
      repository.orderItem.getByIds(order.items)
    ),
    payments: async (order, _, { dataSources: { repository } }) => (
      repository.paymentTransaction.getByIds(order.payments)
    ),
    deliveryOrders: async (order, _, { dataSources: { repository } }) => (
      repository.deliveryOrder.getByIds(order.deliveryOrders)
    ),
    price: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.price,
        currency: order.currency,
      })
    ),
    deliveryPrice: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.deliveryPrice,
        currency: order.currency,
      })
    ),
    tax: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.tax,
        currency: order.currency,
      })
    ),
    total: async (order) => (
      CurrencyFactory.getAmountOfMoney({
        centsAmount: order.total,
        currency: order.currency,
      })
    ),
    buyer: async (order, _, { dataSources: { repository } }) => (
      repository.user.getById(order.buyer)
    ),
    createdAt: (order) => new Date(order.createdAt).toDateString(),
  },
};
