import { useTranslation } from 'react-i18next';
import { useLang } from '../data/pick';
import { useAsync } from '../lib/useAsync';
import { getGithub, isNotConfigured } from '../lib/integrations';
import Spinner from './Spinner';
import NotConfigured from './NotConfigured';
import CmdLink from './CmdLink';
import { BarList, ContributionHeatmap, StatTiles } from './Charts';

export default function Stats({ flags = {} }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const state = useAsync('stats', (signal) => getGithub('stats', { signal }));
  const showOverview = !flags.repos || flags.tudo;
  const showRepos = flags.repos || flags.tudo;

  if (state.status === 'loading') return <Spinner label={t('github.loading')} />;
  if (state.status === 'error') {
    return isNotConfigured(state.error) ? (
      <NotConfigured name="GitHub stats" envVar="GITHUB_TOKEN" />
    ) : (
      <p className="out-error">✗ {t('errors.network')}</p>
    );
  }
  const { totals, calendar, languages, topRepos } = state.data.stats;
  const n = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'pt-BR');

  return (
    <div className="out">
      {showOverview && (
        <>
          <p className="out-title">{t('stats.title')}</p>
          <StatTiles
            items={[
              { value: n.format(totals.contributions), label: t('stats.contributions') },
              { value: n.format(totals.commits), label: t('stats.commits') },
              { value: n.format(totals.pullRequests), label: t('stats.prs') },
              { value: n.format(totals.repos), label: t('stats.repos') },
              { value: n.format(totals.stars), label: t('stats.stars') },
              { value: n.format(totals.followers), label: t('stats.followers') },
            ]}
          />
          <ContributionHeatmap weeks={calendar} total={totals.contributions} />
          <p className="out-title">{t('stats.languages')}</p>
          <BarList items={languages.map((l) => ({ label: l.name, value: l.percent, display: `${n.format(l.percent)}%` }))} max={100} />
        </>
      )}
      {showRepos && (
        <>
          <p className="out-title">{t('stats.topRepos')}</p>
          <BarList
            items={topRepos.map((r) => ({
              label: r.name,
              value: r.stars,
              display: `★ ${r.stars} · ${r.language ?? '—'}`,
            }))}
          />
        </>
      )}
      <p className="out-muted">
        {t('stats.modes')} <CmdLink cmd="stats --repos" /> · <CmdLink cmd={`stats --${lang === 'en' ? 'all' : 'tudo'}`} />
      </p>
    </div>
  );
}
