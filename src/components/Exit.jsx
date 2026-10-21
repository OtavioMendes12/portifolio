import { useTranslation } from 'react-i18next';

export default function Exit() {
  const { t } = useTranslation();
  return <p className="out accent">{t('eggs.exit')}</p>;
}
