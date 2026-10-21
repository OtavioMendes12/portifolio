import { useTranslation } from 'react-i18next';
import { FaCodeFork, FaStar } from 'react-icons/fa6';
import { useLang } from '../data/pick';
import { useAsync } from '../lib/useAsync';
import { getGithub } from '../lib/integrations';
import { relativeTime } from '../lib/relativeTime';
import { GITHUB_USER } from '../config/github';
import Spinner from './Spinner';
import './GitHub.css';

export default function GitHub() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const state = useAsync('repos', (signal) => getGithub('repos', { signal }));

  if (state.status === 'loading') return <Spinner label={t('github.loading')} />;
  if (state.status === 'error') return <p className="out-error">✗ {t('errors.network')}</p>;
  const repos = state.data.repos.slice(0, 12);

  return (
    <div className="out">
      <p className="out-title">{t('github.title', { user: GITHUB_USER, count: state.data.repos.length })}</p>
      <div className="card-grid">
        {repos.map((r) => (
          <article key={r.name} className="card repo">
            <a className="repo-name" href={r.url} target="_blank" rel="noreferrer">
              {r.name}
            </a>
            {r.description && <p className="repo-desc">{r.description}</p>}
            <p className="repo-meta">
              {r.language && <span className="badge">{r.language}</span>}
              <span title={t('github.stars')}>
                <FaStar aria-hidden="true" /> {r.stars}
              </span>
              <span title={t('github.forks')}>
                <FaCodeFork aria-hidden="true" /> {r.forks}
              </span>
              <span className="out-dim">{relativeTime(r.updatedAt, lang)}</span>
            </p>
          </article>
        ))}
      </div>
      <p className="out-muted">
        {t('github.more')}{' '}
        <a href={`https://github.com/${GITHUB_USER}`} target="_blank" rel="noreferrer">
          github.com/{GITHUB_USER}
        </a>
      </p>
    </div>
  );
}
