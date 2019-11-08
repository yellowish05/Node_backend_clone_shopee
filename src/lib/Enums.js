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

const MessageType = EnumFactory({
  TEXT: 'TEXT',
  STICKER: 'STICKER',
  ASSET: 'ASSET',
});

module.exports = {
  StreamChannelType,
  StreamRecordStatus,
  StreamChannelStatus,
  StreamRole,
  MessageType,
};
