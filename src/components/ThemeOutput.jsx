import { Trans, useTranslation } from 'react-i18next';
import { THEMES } from '../theme/themeContext';
import { useTerminal } from '../terminal/TerminalContext';
import { useLang } from '../data/pick';
import CmdLink from './CmdLink';

const SWATCHES = ['--bg-terminal', '--surface', '--text', '--text-muted', '--accent', '--success', '--warn', '--info', '--busy'];

export default function ThemeOutput({ theme, unknown }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const { registry } = useTerminal();
  const cmdName = registry.displayName(registry.find('tema'), lang);

  if (unknown) {
    return (
      <div className="out">
        <p className="out-error">{t('tema.unknown', { name: unknown })}</p>
        <p className="out-muted">
          {t('tema.options')}{' '}
          {THEMES.map((id) => (
            <span key={id}>
              <CmdLink cmd={`${cmdName} --${id}`} />{' '}
            </span>
          ))}
        </p>
      </div>
    );
  }

  return (
    <div className="out">
      <p>
        <Trans i18nKey="tema.changed" values={{ name: t(`themes.${theme}`) }} components={{ b: <strong className="accent" /> }} />
      </p>
      <p className="swatches" aria-hidden="true">
        {SWATCHES.map((v) => (
          <span key={v} className="swatch" style={{ background: `var(${v})` }} />
        ))}
      </p>
    </div>
  );
}
