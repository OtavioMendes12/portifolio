import { useTranslation } from 'react-i18next';
import { useAsync } from '../lib/useAsync';
import { formatMatchDate, getFutebol, sides } from '../lib/futebol';
import { getRecentTracks, getVisits, getWakatime, getWeather, weatherText } from '../lib/integrations';
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

function CodingLine() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const state = useAsync('waka-now', (signal) => getWakatime('agora', { signal }));
  if (state.status !== 'success' || !state.data.coding) return null; // offline: a linha some
  const d = state.data;
  return (
    <StatusLine tone="success">
      {t('status.coding')} ·{' '}
      <CmdLink cmd={`wakatime --${lang === 'en' ? 'now' : 'agora'}`}>
        {[d.project, d.language, d.editor].filter(Boolean).join(' · ')}
      </CmdLink>{' '}
      · {t('status.session', { min: d.sessionMinutes })}
    </StatusLine>
  );
}

function MusicLine() {
  const { t } = useTranslation();
  const state = useAsync('lastfm-now', (signal) => getRecentTracks({ limit: 1, signal }));
  if (state.status !== 'success' || !state.data[0]) return null;
  const track = state.data[0];
  return (
    <StatusLine tone={track.nowPlaying ? 'info' : 'muted'}>
      {track.nowPlaying ? t('status.listening') : t('status.lastListened')} ·{' '}
      <CmdLink cmd="spotify">
        {track.name} — {track.artist}
      </CmdLink>
    </StatusLine>
  );
}

function VisitsWeatherLine() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const visits = useAsync('visits', () => getVisits());
  const weather = useAsync('weather', (signal) => getWeather({ signal }));
  const parts = [];
  if (visits.status === 'success') parts.push(t('status.visits', { count: visits.data }));
  if (weather.status === 'success') {
    parts.push(t('status.weather', { temp: weather.data.temp, sky: weatherText(weather.data.code, lang) }));
  }
  if (!parts.length) return null;
  return <StatusLine tone="warn">{parts.join(' · ')}</StatusLine>;
}

/** Linhas "ao vivo" do cabeçalho. Cada integração some sozinha se falhar. */
export default function StatusLines() {
  return (
    <ul className="status-lines" aria-label="status">
      <CodingLine />
      <MusicLine />
      <NextMatchLine />
      <VisitsWeatherLine />
    </ul>
  );
}
