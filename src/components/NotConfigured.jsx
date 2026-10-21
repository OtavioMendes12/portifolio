import { useTranslation } from 'react-i18next';

/** Integração sem chave: avisa em vez de quebrar. */
export default function NotConfigured({ name, envVar }) {
  const { t } = useTranslation();
  return (
    <div className="out">
      <p className="out-muted">
        <span className="status-dot" aria-hidden="true" />
        {name}: {t('ui.notConfigured')}
      </p>
      {envVar && <p className="out-dim">{t('ui.notConfiguredHint', { env: envVar })}</p>}
    </div>
  );
}
