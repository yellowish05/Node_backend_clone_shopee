const path = require('path');

const { translate_ggl: translate } = require(path.resolve('src/lib/TranslateService'));
const { LanguageList } = require(path.resolve('src/lib/Enums'));

const activity = {

};

module.exports = async (req, res) => {
  const query = { $or: [{"translations": {$exists: false}}, {"translations.en": {$exists: false}}] }
}
