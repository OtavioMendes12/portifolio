import { useTranslation } from 'react-i18next';
import { useLang } from '../data/pick';
import { useAsync } from '../lib/useAsync';
import { competitionName, formatMatchDate, getFutebol, noteText, phaseName, sides } from '../lib/futebol';
import { profile } from '../data/profile';
import Spinner from './Spinner';
import Countdown from './Countdown';
import CmdLink from './CmdLink';
import './Campeonato.css';

function Crest({ team, size = 40 }) {
  if (!team?.logo) return <span className="crest crest--empty" style={{ width: size, height: size }} aria-hidden="true" />;
  return <img className="crest" src={team.logo} alt="" width={size} height={size} loading="lazy" referrerPolicy="no-referrer" />;
}

function Teams({ ev, showScore = false, size }) {
  return (
    <div className="match-teams">
      <span className="match-team">
        <Crest team={ev.home} size={size} />
        <span>{ev.home?.name}</span>
      </span>
      <span className="match-vs">{showScore ? `${ev.home?.score ?? '-'} × ${ev.away?.score ?? '-'}` : '×'}</span>
      <span className="match-team match-team--away">
        <span>{ev.away?.name}</span>
        <Crest team={ev.away} size={size} />
      </span>
    </div>
  );
}

function MatchMeta({ ev }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const phase = phaseName(ev, lang);
  return (
    <p className="match-comp">
      <span>{[competitionName(ev, lang), phase].filter(Boolean).join(' · ')}</span>
      <span className={`badge ${ev.galoHome ? 'badge--accent' : ''}`}>{ev.galoHome ? t('campeonato.home') : t('campeonato.away')}</span>
    </p>
  );
}

function NextMatch({ ev, live }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  return (
    <article className="card match match--next">
      <MatchMeta ev={ev} />
      <Teams ev={ev} showScore={live} size={56} />
      {live && <p className="match-live">● {t('campeonato.live')} · {ev.detail}</p>}
      <p className="match-when">
        {formatMatchDate(ev, lang)} <span className="out-dim">({t('campeonato.brt')})</span>
      </p>
      {ev.venue && (
        <p className="out-muted">
          {ev.venue}
          {ev.city && `, ${ev.city}`}
        </p>
      )}
      {ev.note && <p className="out-dim">{noteText(ev.note, lang)}</p>}
      {!live && ev.timeValid && <Countdown to={ev.date} />}
    </article>
  );
}

function SmallMatch({ ev, teamId }) {
  const { lang } = useLang();
  const { t } = useTranslation();
  const { rival } = sides(ev, teamId);
  return (
    <article className="card match match--small">
      <MatchMeta ev={ev} />
      <p className="match-small-rival">
        <Crest team={rival} size={28} />
        <span>
          {ev.galoHome ? t('campeonato.vs') : t('campeonato.at')} {rival?.name}
        </span>
      </p>
      <p className="out-muted">{formatMatchDate(ev, lang)}</p>
    </article>
  );
}

function LastResult({ ev }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  return (
    <article className="card match match--last">
      <p className="match-comp">
        <span>
          {t('campeonato.last')} · {competitionName(ev, lang)}
        </span>
        <span className={`result result--${ev.result}`} title={t(`campeonato.results.${ev.result}`)}>
          {t(`campeonato.resultLetter.${ev.result}`)}
        </span>
      </p>
      <Teams ev={ev} showScore size={32} />
      <p className="out-dim">
        {formatMatchDate(ev, lang, { short: true })}
        {ev.note && ` · ${noteText(ev.note, lang)}`}
      </p>
    </article>
  );
}

function Summary({ data }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const [first, ...rest] = data.next;
  const main = data.live ?? first;
  const others = (data.live ? data.next.filter((e) => e.id !== data.live.id) : rest).slice(0, 4);
  const cmd = lang === 'en' ? 'galo' : 'campeonato';

  return (
    <>
      {main ? <NextMatch ev={main} live={Boolean(data.live)} /> : <p className="out-muted">{t('campeonato.noGames')}</p>}
      {others.length > 0 && (
        <section className="match-section">
          <p className="out-title">{t('campeonato.upcoming')}</p>
          <div className="match-grid">
            {others.map((ev) => (
              <SmallMatch key={ev.id} ev={ev} teamId={data.teamId} />
            ))}
          </div>
        </section>
      )}
      {data.last && <LastResult ev={data.last} />}
      <p className="out-muted">
        {t('campeonato.more')} <CmdLink cmd={`${cmd} --${lang === 'en' ? 'all' : 'todos'}`} /> ·{' '}
        <CmdLink cmd={`${cmd} --${lang === 'en' ? 'table' : 'tabela'}`} />
      </p>
    </>
  );
}

function AllFixtures({ data }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  if (!data.fixtures.length) return <p className="out-muted">{t('campeonato.noGames')}</p>;
  return (
    <ul className="fixtures">
      {data.fixtures.map((ev) => {
        const { rival } = sides(ev, data.teamId);
        return (
          <li key={ev.id}>
            <span className="fixtures-date">{formatMatchDate(ev, lang, { short: true })}</span>
            <span className="fixtures-rival">
              <Crest team={rival} size={20} /> {ev.galoHome ? t('campeonato.vs') : t('campeonato.at')} {rival?.name}
            </span>
            <span className="out-dim">{competitionName(ev, lang)}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Table({ data }) {
  const { t } = useTranslation();
  const n = data.rows.length;
  return (
    <>
      <p className="out-dim">{data.season}</p>
      <div className="table-wrap">
        <table className="standings">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">{t('campeonato.table.team')}</th>
              <th scope="col" title={t('campeonato.table.pointsLong')}>{t('campeonato.table.points')}</th>
              <th scope="col">{t('campeonato.table.played')}</th>
              <th scope="col" className="opt">{t('campeonato.table.wins')}</th>
              <th scope="col" className="opt">{t('campeonato.table.ties')}</th>
              <th scope="col" className="opt">{t('campeonato.table.losses')}</th>
              <th scope="col">{t('campeonato.table.gd')}</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr
                key={r.id}
                className={[r.id === data.teamId && 'is-galo', r.rank <= 4 && 'zone-top', r.rank > n - 4 && 'zone-bottom']
                  .filter(Boolean)
                  .join(' ')}
              >
                <td>{r.rank}</td>
                <td>
                  <span className="standings-team">
                    <Crest team={r} size={18} /> {r.name}
                  </span>
                </td>
                <td className="standings-pts">{r.points}</td>
                <td>{r.played}</td>
                <td className="opt">{r.wins}</td>
                <td className="opt">{r.ties}</td>
                <td className="opt">{r.losses}</td>
                <td>{r.goalDiff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="out-dim standings-legend">
        <span className="legend legend--top" /> {t('campeonato.table.top')} <span className="legend legend--bottom" />{' '}
        {t('campeonato.table.bottom')}
      </p>
    </>
  );
}

export default function Campeonato({ flags = {} }) {
  const { t } = useTranslation();
  const view = flags.tabela ? 'tabela' : flags.todos ? 'todos' : 'resumo';
  const state = useAsync(view, (signal) => getFutebol(view, { signal }));

  if (state.status === 'loading') return <Spinner label={t('campeonato.loading')} />;
  if (state.status === 'error') {
    return (
      <div className="out">
        <p className="out-error">✗ {t('campeonato.error')}</p>
        <p className="out-muted">
          {t('campeonato.fallback')}{' '}
          <a href={profile.clubSite} target="_blank" rel="noreferrer">
            atletico.com.br
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="out campeonato">
      <p className="out-title">{t(`campeonato.titles.${view}`)}</p>
      {view === 'resumo' && <Summary data={state.data} />}
      {view === 'todos' && <AllFixtures data={state.data} />}
      {view === 'tabela' && <Table data={state.data} />}
      <p className="out-dim campeonato-source">{t('campeonato.source')}</p>
    </div>
  );
}
