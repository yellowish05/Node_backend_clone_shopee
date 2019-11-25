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

const MetricSystem = EnumFactory({
  USC: 'USC',
  SI: 'SI',
});

const WeightUnitSystem = EnumFactory({
  OUNCE: 'OUNCE',
  GRAM: 'GRAM',
});

const Currency = EnumFactory({
  USD: 'USD',
  GBP: 'GBP',
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

module.exports = {
  StreamChannelType,
  StreamRecordStatus,
  StreamChannelStatus,
  StreamRole,

  SourceType,
  MessageType,
  LoginProvider,
  MetricSystem,
  Currency,
  InventoryLogType,
  VerificationEmailTemplate,
  NotificationType,
  WeightUnitSystem,
};
