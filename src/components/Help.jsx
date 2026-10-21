import { Trans, useTranslation } from 'react-i18next';
import { useTerminal } from '../terminal/TerminalContext';
import { useLang } from '../data/pick';
import CmdLink from './CmdLink';
import './Help.css';

export default function Help() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { registry } = useTerminal();

  return (
    <div className="out help">
      <p className="out-title">{t('help.title')}</p>
      <ul className="help-list">
        {registry.visible.map((c) => {
          const primary = registry.displayName(c, lang);
          const others = [c.name, ...(c.aliases ?? [])].filter((n) => n !== primary);
          return (
            <li key={c.name}>
              <span className="help-name">
                <CmdLink cmd={primary} />
              </span>
              <span className="help-desc">
                {t(`commands.${c.name}.desc`)}
                {others.length > 0 && (
                  <span className="help-aliases">
                    {' '}
                    ({t('help.aliases')}: {others.join(', ')})
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="out-title">{t('help.keysTitle')}</p>
      <ul className="help-keys">
        {['history', 'tab', 'clear', 'click'].map((k) => (
          <li key={k}>{t(`help.keys.${k}`)}</li>
        ))}
      </ul>
      <p className="out-muted">
        <Trans i18nKey="help.tip" components={{ cmd: <CmdLink /> }} />
      </p>
    </div>
  );
}
