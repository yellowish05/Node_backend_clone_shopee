const unirest = require('unirest');
const path = require('path');

const { xRapidAPIConfig } = require(path.resolve('config'));

module.exports = {
  translate(targetLang, text, sourceLang = 'auto') {
    return unirest
      .get(xRapidAPIConfig.url)
      .headers({
        'x-rapidapi-key': xRapidAPIConfig.apiKey,
        'x-rapidapi-host': xRapidAPIConfig.host,
        useQueryString: true,
      })
      .query({
        source: sourceLang,
        target: targetLang,
        input: text,
      })
      .then((response) => (response.body.outputs ? response.body.outputs[0].output : null))
      .catch((err) => {
        console.log('Translation Failed.', err.message);
        return null;
      });
  },
  translate_ggl(targetLang, text) {
    if (targetLang === 'zh') {
      targetLang = 'zh-cn';
    }
    return unirest
      .post('http://localhost:5000/api/googletrans')
      .headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      })
      .send({ text, dest: targetLang })
      .then((response) => {
        return response.body.data;
      })
      .catch((err) => {
        console.log('[Translation] Failed', err.message);
        return null;
      })
  },
};
