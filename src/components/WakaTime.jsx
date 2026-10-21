import { useTranslation } from 'react-i18next';
import { useAsync } from '../lib/useAsync';
import { getWakatime, isNotConfigured } from '../lib/integrations';
import { useLang } from '../data/pick';
import { relativeTime } from '../lib/relativeTime';
import { WAKATIME_USER } from '../config/wakatime';
import Spinner from './Spinner';
import NotConfigured from './NotConfigured';
import CmdLink from './CmdLink';
import { BarList, StatTiles } from './Charts';
import { formatSeconds } from '../lib/duration';

const bars = (list, lang) => list.map((x) => ({ label: x.name, value: x.seconds, display: formatSeconds(x.seconds, lang) }));

function Now({ data }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  if (!data.coding) {
    return (
      <p className="out-muted">
        <span className="status-dot" aria-hidden="true" />
        {t('wakatime.offline')}
        {data.lastSeen && ` · ${t('wakatime.lastSeen', { when: relativeTime(data.lastSeen, lang) })}`}
      </p>
    );
  }
  return (
    <div className="card out">
      <p>
        <span className="status-dot status-dot--success" aria-hidden="true" />
        {t('wakatime.codingNow')}
      </p>
      <p className="out-muted">
        {[data.project, data.language, data.editor].filter(Boolean).join(' · ')} · {t('wakatime.session', { min: data.sessionMinutes })}
      </p>
      {data.today && <p className="out-dim">{t('wakatime.today', { time: data.today })}</p>}
    </div>
  );
}

function Week({ data, cards }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  return (
    <>
      <StatTiles
        items={[
          { value: formatSeconds(data.totalSeconds, lang), label: t('wakatime.total') },
          { value: data.dailyAverageSeconds ? formatSeconds(data.dailyAverageSeconds, lang) : '—', label: t('wakatime.average') },
          { value: data.languages.length, label: t('wakatime.languagesCount') },
        ]}
      />
      {cards ? (
        <div className="card-grid">
          {data.languages.map((l) => (
            <article key={l.name} className="card">
              <p className="accent">{l.name}</p>
              <p>{formatSeconds(l.seconds, lang)}</p>
              <p className="out-dim">{l.percent}%</p>
            </article>
          ))}
        </div>
      ) : (
        <>
          <p className="out-title">{t('wakatime.languages')}</p>
          <BarList items={bars(data.languages, lang)} />
          {data.projects.length > 0 && (
            <>
              <p className="out-title">{t('wakatime.projects')}</p>
              <BarList items={bars(data.projects, lang)} />
            </>
          )}
        </>
      )}
      {!data.upToDate && <p className="out-dim">{t('wakatime.updating')}</p>}
    </>
  );
}

export default function WakaTime({ flags = {} }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const view = flags.agora ? 'agora' : 'semana';
  const state = useAsync(view, (signal) => getWakatime(view, { signal }));

  if (state.status === 'loading') return <Spinner label={t('wakatime.loading')} />;
  if (state.status === 'error') {
    return isNotConfigured(state.error) ? (
      <NotConfigured name="WakaTime" envVar="WAKATIME_API_KEY" />
    ) : (
      <p className="out-error">✗ {t('errors.network')}</p>
    );
  }

  return (
    <div className="out">
      <p className="out-title">{t(view === 'agora' ? 'wakatime.titleNow' : 'wakatime.title')}</p>
      {view === 'agora' ? <Now data={state.data} /> : <Week data={state.data} cards={Boolean(flags.cards)} />}
      <p className="out-muted">
        {t('wakatime.modes')} <CmdLink cmd={`wakatime --${lang === 'en' ? 'now' : 'agora'}`} /> · <CmdLink cmd="wakatime --cards" />
        {WAKATIME_USER && (
          <>
            {' · '}
            <a href={`https://wakatime.com/@${WAKATIME_USER}`} target="_blank" rel="noreferrer">
              wakatime.com/@{WAKATIME_USER}
            </a>
          </>
        )}
      </p>
    </div>
  );
}
