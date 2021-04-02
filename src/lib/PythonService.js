const path = require('path');
const axios = require('axios');
const { pythonServer } = require(path.resolve('config'));
const { LanguageList } = require(path.resolve('src/lib/Enums'));

const instance = axios.create({
  baseURL: pythonServer,
  timeout: 10 * 60 * 1000,
});

module.exports = {
  async detectLanguage(text) {
    return LanguageList.ZH;
    // return instance.post('/api/detect-lang', { text })
    //   .then(({ status, data }) => {
    //     return LanguageList.ZH;
    //     // return data.lang
    //   })
  },
  async extractKeyword(text) {
    return instance.post('/api/keywords', { query_string: text })
      .then(({ status, data }) => {
        if (data.staus !== undefined && data.status === false) {
          throw Error(data.message);
        } else {
          return data;
        }
      })
  },
  googletrans(text, dest) {
    return instance.post('/api/googletrans', { text, dest })
      .then(({ status, data }) => {
        if (!data.status) {
          throw Error(data.message);
        } else {
          return data.data;
        }
      })
  },
}

