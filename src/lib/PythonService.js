const path = require('path');
const axios = require('axios');
const { pythonServer } = require(path.resolve('config'));
const { LanguageList } = require(path.resolve('src/lib/Enums'));

const instance = axios.create({
  baseURL: pythonServer,
  timeout: 1000,
});

module.exports = {
  async detectLanguage(text) {
    return instance.post('/api/detect-lang', { text })
      .then(({ status, data }) => {
        return LanguageList.CHI;
        // return data.lang
      })
  },
}

