const path = require('path');
const { Validator } = require('node-input-validator');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

const selectRecordSourceInLiveStream = async (liveStream, currentRecord = null, repository) => {
  let sourceIds;
  return repository.streamChannel.load(liveStream.channel)
    .then(streamChannel => {
      sourceIds = streamChannel.record.sources;
      return Promise.all(sourceIds.map(sourceId => repository.streamSource.load(sourceId)))
    })
    .then(async streamSources => {
      if (!currentRecord) return streamSources[streamSources.length - 1]; // as previous queue, return latest video in the array.
      const idx = sourceIds.indexOf(currentRecord);
      return idx > 0 ? streamSources[idx - 1] : null;
    })
}

module.exports = async (_, args, { dataSources: { repository } }) => {
  const validator = new Validator(args, {
    liveStream: 'required',
    currentRecord: 'required',
  });

  let foundLiveStream;

  validator.addPostRule(async provider => {
    await repository.liveStream.load(provider.inputs.liveStream)
      .then(liveStream => {
        if (!liveStream) provider.error("liveStream", "custom", `Live stream with id "${provider.inputs.liveStream}" does not exist!`);
        foundLiveStream = liveStream;
        return repository.streamChannel.load(liveStream.channel);
      })
      .then(channel => {
        if (!channel) provider.error("liveStream", "custom", "Live stream does not have valid stream channel!");
      })
  })

  return validator.check()
    .then(matched => {
      if (!matched) {
        throw errorHandler.build(validator.errors);
      }
    })
    .then(async () => {
      // find prev record in the current livestream.
      let record, liveStream;
      liveStream = foundLiveStream; console.log('[liveStream]', liveStream.channel)
      record = await selectRecordSourceInLiveStream(liveStream, args.currentRecord, repository);

      if (!record) {
        liveStream = await repository.liveStream.getNextStream(args.liveStream); // sort type: DESC now.
        record = selectRecordSourceInLiveStream(liveStream, null, repository);
      }
      return { record, liveStream};
    })
}
