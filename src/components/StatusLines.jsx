import { useTranslation } from 'react-i18next';
import { useAsync } from '../lib/useAsync';
import { formatMatchDate, getFutebol, sides } from '../lib/futebol';
import { useLang } from '../data/pick';
import CmdLink from './CmdLink';
import './StatusLines.css';

/** Uma linha de status: bolinha colorida + texto. Sem dados, não renderiza. */
export function StatusLine({ tone = 'accent', children }) {
  return (
    <li className="status-line">
      <span className={`status-dot status-dot--${tone}`} aria-hidden="true" />
      <span className="status-prompt" aria-hidden="true">
        &gt;
      </span>{' '}
      {children}
    </li>
  );
}

function NextMatchLine() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const state = useAsync('resumo', (signal) => getFutebol('resumo', { signal }));
  if (state.status !== 'success') return null;
  const { live, next, teamId } = state.data;
  const ev = live ?? next?.[0];
  if (!ev) return null;
  const { galo, rival } = sides(ev, teamId);
  const cmd = lang === 'en' ? 'galo' : 'campeonato';

  if (live) {
    return (
      <StatusLine tone="busy">
        {t('status.live')}:{' '}
        <CmdLink cmd={cmd}>
          {galo?.abbr} {galo?.score ?? 0} × {rival?.score ?? 0} {rival?.abbr}
        </CmdLink>
      </StatusLine>
    );
  }
  return (
    <StatusLine tone="accent">
      {t('status.nextMatch')}:{' '}
      <CmdLink cmd={cmd}>
        {rival?.name} · {formatMatchDate(ev, lang)}
      </CmdLink>
    </StatusLine>
  );
}

/** Linhas "ao vivo" do cabeçalho. Cada integração some sozinha se falhar. */
export default function StatusLines() {
  return (
    <ul className="status-lines" aria-label="status">
      <NextMatchLine />
    </ul>
  );
}
