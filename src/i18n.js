const SUPPORTED_LANGUAGES = ["ko", "en", "ja", "zh", "es", "fr", "de", "th", "ru", "pt", "it"];

const dictionary = {
  common: { hello: { ko: "안녕하세요", en: "Hello" } },
  layout: {},
  home: {},
  groups: {},
  events: {},
  classes: {},
  messages: {},
  points: {},
  referrals: {},
  admin: {},
  board: {},
  not_found: {},
  settings: {},
  profile: {},
  pwa: {},
};

function t(key, lang = "ko") {
  const [section, subKey] = key.split(".");
  const entry = dictionary[section]?.[subKey];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
}

function useLanguage(initial = "ko") {
  let current = SUPPORTED_LANGUAGES.includes(initial) ? initial : "ko";
  return {
    get language() {
      return current;
    },
    setLanguage(next) {
      if (SUPPORTED_LANGUAGES.includes(next)) current = next;
      return current;
    },
    t: (key) => t(key, current),
  };
}

module.exports = { SUPPORTED_LANGUAGES, t, useLanguage };
