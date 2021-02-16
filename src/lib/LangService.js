const CountryLanguage = require('country-language');
const languages = CountryLanguage.getLanguages();

const convertLangCode3to2 = (langCode) => {
    langCode = langCode.toLowerCase();
    const [match] = languages.filter(lang => lang.iso639_2en === langCode || lang.iso639_3 === langCode);
    return match ? match.iso639_1.toUpperCase() : 'EN';
}

const convertLangCode2to3 = (langCode) => {
    langCode = langCode.toLowerCase();
    const [match] = languages.filter(lang => lang.iso639_1 === langCode);
    return match ? match.iso639_2en == '' ? match.iso639_3.toUpperCase() : match.iso639_2en.toUpperCase() : langCode.toUpperCase();
}

module.exports = {
    convertLangCode3to2,
    convertLangCode2to3
};
