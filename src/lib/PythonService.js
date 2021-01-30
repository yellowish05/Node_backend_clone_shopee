const path = require('path');
const axios = require('axios');
const { pythonServer } = require(path.resolve('config'));

const instance = axios.create({
  baseURL: pythonServer,
  timeout: 1000,
});

module.exports = {
  async detectLanguage(text) {
    return instance.post('/api/detect-lang', { text })
      .then(({ status, data }) => {
        return data.lang
      })
  },
}

