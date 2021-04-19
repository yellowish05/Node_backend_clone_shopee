const path = require('path');
const axios = require('axios');

const { xRapidAPIConfig, internal } = require(path.resolve('config'));

module.exports = {
  translate(targetLang, text, sourceLang = 'auto') {
    return axios.get(
      xRapidAPIConfig,
      {
        params: {
          source: sourceLang,
          target: targetLang,
          input: text,
        },
      },
      {
        headers: {
          'x-rapidapi-key': xRapidAPIConfig.apiKey,
          'x-rapidapi-host': xRapidAPIConfig.host,
          useQueryString: true,
        },
      }
    )
      .then((response) => (response.data.outputs ? response.data.outputs[0].output : null))
      .catch((err) => {
        console.log('Translation Failed.', err.message);
        return null;
      });
  },
  translate_ggl(targetLang, text) {
    if (targetLang === 'zh') {
      targetLang = 'zh-cn';
    }
    return axios.post(
      `${internal.translation}/api/googletrans`, 
      {
        dest: targetLang,
        text,
      }, 
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',        
        },
      }
    )
      .then(({ data: {data, status} }) => data)
      .catch((err) => {
        console.log('[Translation] Failed', err.message);
        return null;
      });
  }
};
