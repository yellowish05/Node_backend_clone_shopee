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

const Currency = EnumFactory({
  USD: 'USD',
  GBP: 'GBP',
  CAD: 'CAD',
  AUD: 'AUD',
  SGD: 'SGD',
  EUR: 'EUR',
  NZD: 'NZD',
  INR: 'INR',
});

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

const OrderItemStatus = EnumFactory({
  CREATED: 'CREATED',
  ORDERED: 'ORDERED',
  CARRIER_RECEIVED: 'CARRIER_RECEIVED',
  DELIVERED: 'DELIVERED',
  COMPLETE: 'COMPLETE',
});

const PaymentTransactionStatus = EnumFactory({
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAIL: 'FAIL',
  REFUND: 'REFUND',
});


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
  OrderItemStatus,
  PaymentTransactionStatus,
};
