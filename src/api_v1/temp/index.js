/**
 * This router is for dev only. not for the front-end developer!!!
 */
const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const { listLanguageCodes, getLanguageName } = require('language-cultures');
const CountryLanguage = require('country-language');
const languages = CountryLanguage.getLanguages();
const { Translate } = require('@google-cloud/translate').v2;
const projectId = 'streambliss-test-enviornment';
const translate = new Translate({ projectId });
const repository = require(path.resolve('src/repository'));
const { convertLangCode3to2 } = require(path.resolve('src/lib/LangService'));

const tempRouter = express.Router();

// language list in language culture mode(en-US)
tempRouter.route('/lang-culture').get(async (req, res) => {
	res.json(listLanguageCodes());
})

// language list in iso639
tempRouter.route('/lang-2').get(async (req, res) => {
	res.json(languages);
})

// language list supported by Google cloud translation API
tempRouter.route('/lang-google').get(async (req, res) => {
	const [langs] = await translate.getLanguages();
	res.json(langs);
})

// update user settings.language: from iso639-3 => iso639-1
tempRouter.route('/update-user-lang').get(async (req, res) => {
	repository.user.loadAll()
		.then(users => users.filter(user => user._id))
		.then(users => Promise.all(users.map(user => repository.user.updateLangSetting(user._id, convertLangCode3to2(user.settings.language || 'ENG')))))
		.then(updates => res.json({ status: true, message: 'All user langs has been updated!' }))
		.catch(error => res.json({ status: false, message: 'Failed to update user langs' }));
});

module.exports = tempRouter;
