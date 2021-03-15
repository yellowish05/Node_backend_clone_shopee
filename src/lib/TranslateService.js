// const unirest = require('unirest');
// const path = require('path');

// const { xRapidAPIConfig } = require(path.resolve('config'));

// module.exports = {
//   translate(targetLang, text, sourceLang = 'auto') {
//     return unirest
//       .get(xRapidAPIConfig.url)
//       .headers({
//         'x-rapidapi-key': xRapidAPIConfig.apiKey,
//         'x-rapidapi-host': xRapidAPIConfig.host,
//         useQueryString: true,
//       })
//       .query({
//         source: sourceLang,
//         target: targetLang,
//         input: text,
//       })
//       .then((response) => response.body.outputs[0].output)
//       .catch((err) => {
//         console.log('Translation Failed.', err.message);
//         return null;
//       });
//   },
// };
