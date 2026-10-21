import { useTranslation } from 'react-i18next';

/** Conteúdo bilíngue fica como { pt, en }. pick() devolve o do idioma atual. */
export const pick = (value, lang) =>
  value && typeof value === 'object' && !Array.isArray(value) && 'pt' in value ? (value[lang] ?? value.pt) : value;

export function useLang() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('en') ? 'en' : 'pt';
  return { lang, pick: (v) => pick(v, lang) };
}
