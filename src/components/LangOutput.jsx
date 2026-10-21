import { useTranslation } from 'react-i18next';

export default function LangOutput({ lang, unknown }) {
  const { t } = useTranslation();
  if (unknown) return <p className="out-error">{t('idioma.unknown', { name: unknown })}</p>;
  // Traduz no idioma escolhido naquele momento, não no atual.
  return <p className="out">{t('idioma.changed', { lng: lang })}</p>;
}
