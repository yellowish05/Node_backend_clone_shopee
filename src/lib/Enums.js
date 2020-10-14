const fs = require('fs');
const path = require('path');
const CountryLanguage = require('country-language');
const languages = CountryLanguage.getLanguages();

function EnumFactory(object) {
  return Object.freeze({
    ...object,
    toGQL: () => Object.values(object).join(' '),
    toList: () => Object.values(object),
  });
}

const StreamChannelType = EnumFactory({
  BROADCASTING: 'BROADCASTING',
  VIDEO_CALL: 'VIDEO_CALL',
  VOICE_CALL: 'VOICE_CALL',
});

const StreamRecordStatus = EnumFactory({
  PENDING: 'PENDING',
  RECORDING: 'RECORDING',
  FINISHED: 'FINISHED',
  FAILED: 'FAILED',
});

const StreamChannelStatus = EnumFactory({
  PENDING: 'PENDING',
  STREAMING: 'STREAMING',
  FINISHED: 'FINISHED',
  ARCHIVED: 'ARCHIVED',
  CANCELED: 'CANCELED',
});

const StreamRole = EnumFactory({
  PUBLISHER: 1,
  SUBSCRIBER: 2,
});

const SourceType = EnumFactory({
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  VIDEO_AUDIO: 'VIDEO_AUDIO',
});

const MessageType = EnumFactory({
  TEXT: 'TEXT',
  STICKER: 'STICKER',
  ASSET: 'ASSET',
});

const LoginProvider = EnumFactory({
  FACEBOOK: 'FACEBOOK',
  GOOGLE: 'GOOGLE',
  WE_CHAT: 'WE_CHAT',
});

const MeasureSystem = EnumFactory({
  SI: 'SI',
  USC: 'USC',
});

const SizeUnitSystem = EnumFactory({
  INCH: 'INCH',
  CENTIMETER: 'CENTIMETER',
});

const WeightUnitSystem = EnumFactory({
  OUNCE: 'OUNCE',
  GRAM: 'GRAM',
});

const currencyEnum = {};
fs.readdirSync(path.resolve('src/lib/CurrencyFactory/currencies/')).forEach((file) => {
  const { name } = path.parse(file);
  currencyEnum[name] = name;
});
const Currency = EnumFactory(currencyEnum);

const InventoryLogType = EnumFactory({
  USER_ACTION: 'USER_ACTION',
  PURCHASE: 'PURCHASE',
  REFUND: 'REFUND',
});

const VerificationEmailTemplate = EnumFactory({
  RESET_PASSWORD: 'RESET_PASSWORD',
  CONFIRM_EMAIL: 'CONFIRM_EMAIL',
});

const NotificationType = EnumFactory({
  SYSTEM: 'SYSTEM',
  MESSAGE: 'MESSAGE',
  SELLER_ORDER: 'SELLER_ORDER',
  BUYER_ORDER: 'BUYER_ORDER',
});

const PushNotification = EnumFactory({
  CHATS: 'CHATS',
  ORDERS: 'ORDERS',
  PROFILE: 'PROFILE',
});

const ComplaintReason = EnumFactory({
  NUDITY: 'NUDITY',
  VIOLENCE: 'VIOLENCE',
  SUICIDE_OR_SELF_INJURY: 'SUICIDE_OR_SELF_INJURY',
  HATE_SPEECH: 'HATE_SPEECH',
  VIOLATING_COPYRIGHT: 'VIOLATING_COPYRIGHT',
  USAGE_OF_PROFANITY: 'USAGE_OF_PROFANITY',
  HARASSMENT: 'HARASSMENT',
  FALSE_NEWS: 'FALSE_NEWS',
  ILLEGAL_SALES: 'ILLEGAL_SALES',
});

const MarketType = EnumFactory({
  DOMESTIC: 'DOMESTIC',
  INTERNATIONAL: 'INTERNATIONAL',
});

const PurchaseOrderStatus = EnumFactory({
  CREATED: 'CREATED',
  ORDERED: 'ORDERED',
  CARRIER_RECEIVED: 'CARRIER_RECEIVED',
  DELIVERED: 'DELIVERED',
  COMPLETE: 'COMPLETE',
  CANCELED: 'CANCELED',
});

const SaleOrderStatus = EnumFactory({
  CREATED: 'CREATED',
  CARRIER_RECEIVED: 'CARRIER_RECEIVED',
  DELIVERED: 'DELIVERED',
  COMPLETE: 'COMPLETE',
  CANCELED: 'CANCELED',
});

const DeliveryOrderStatus = EnumFactory({
  // When Carrier donesn't know this tracking id, not yet in system
  CREATED: 'CREATED',
  UNKNOWN: 'UNKNOWN',
  ACCEPTED: 'ACCEPTED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
});

const OrderItemStatus = EnumFactory({
  CREATED: 'CREATED',
  ORDERED: 'ORDERED',
  CARRIER_RECEIVED: 'CARRIER_RECEIVED',
  DELIVERED: 'DELIVERED',
  COMPLETE: 'COMPLETE',
  CONFIRMED: "CONFIRMED",
  SHIPPED: "SHIPPED",
  CANCELED: "CANCELED",
});

const PaymentTransactionStatus = EnumFactory({
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAIL: 'FAIL',
  REFUND: 'REFUND',
});

const PaymentMethodProviders = EnumFactory({
  STRIPE: 'Stripe',
  APPLEPAY: 'APPLEPAY',
  GOOGLEPAY: 'GOOGLEPAY',
  RAZORPAY: 'RazorPay',
  ALIPAY: 'Alipay',
  WECHATPAY: 'WeChatPay',
  LINEPAY: 'LinePay'
})

const languageEnum = {};
languages.forEach((item) => {
  const name = item.iso639_2en == '' ? item.iso639_3.toUpperCase() : item.iso639_2en.toUpperCase();
  languageEnum[name.split('-')[0]] = name.split('-')[0];
});
const LanguageList = EnumFactory(languageEnum);

module.exports = {
  StreamChannelType,
  StreamRecordStatus,
  StreamChannelStatus,
  StreamRole,

  SourceType,
  MessageType,
  LoginProvider,
  SizeUnitSystem,
  Currency,
  InventoryLogType,
  VerificationEmailTemplate,
  NotificationType,
  MeasureSystem,
  WeightUnitSystem,
  PushNotification,
  ComplaintReason,
  MarketType,
  PurchaseOrderStatus,
  SaleOrderStatus,
  DeliveryOrderStatus,
  OrderItemStatus,
  PaymentTransactionStatus,
  PaymentMethodProviders,
  LanguageList
};
