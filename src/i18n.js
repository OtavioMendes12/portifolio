import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from './locales/pt.json';
import en from './locales/en.json';
import { storage } from './lib/storage';

export const LANGS = ['pt', 'en'];

const initialLang = () => {
  const fromUrl = new URLSearchParams(window.location.search).get('lang');
  if (LANGS.includes(fromUrl)) return fromUrl;
  const saved = storage.get('lang');
  return LANGS.includes(saved) ? saved : 'pt';
};

const syncHtml = (lng) => {
  document.documentElement.lang = lng === 'en' ? 'en' : 'pt-BR';
};

i18n.use(initReactI18next).init({
  resources: { pt: { translation: pt }, en: { translation: en } },
  lng: initialLang(),
  fallbackLng: 'pt',
  interpolation: { escapeValue: false },
  returnNull: false,
});

syncHtml(i18n.language);
i18n.on('languageChanged', (lng) => {
  syncHtml(lng);
  storage.set('lang', lng);
});

export default i18n;
