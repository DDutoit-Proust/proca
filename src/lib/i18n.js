import i18n from "i18next";
//import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import {config} from "../actionPage";
import locales from 'locales/common.json'; // locales is an alias to src/locales/{process.widget.lang} 
let resources = {};

resources[config.lang.toLowerCase()] = {common:locales};

i18n
//  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // we init with resources
    resources: resources,
    languages : config.lang.toLowerCase(),
    lng: config.lang.toLowerCase(),
    fallbackLng: "en",
//    debug: true,
    // have a common namespace used around the full app
    ns: ["common"],
    defaultNS: "common",
    react: {
      transSupportBasicHtmlNodes: true
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;



