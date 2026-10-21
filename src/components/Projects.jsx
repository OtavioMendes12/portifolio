import { useTranslation } from 'react-i18next';
import { FaGithub } from 'react-icons/fa6';
import { FiExternalLink } from 'react-icons/fi';
import { useLang } from '../data/pick';
import { projects } from '../data/projects';
import { normalize } from '../terminal/normalize';
import CmdLink from './CmdLink';
import './Projects.css';

const ALL_TAGS = [...new Set(projects.flatMap((p) => p.tags))].sort();

export default function Projects({ flags = {} }) {
  const { t } = useTranslation();
  const { pick, lang } = useLang();
  const cmd = lang === 'en' ? 'projects' : 'projetos';
  const tag = typeof flags.tag === 'string' ? normalize(flags.tag) : null;
  const list = tag ? projects.filter((p) => p.tags.includes(tag)) : projects;

  return (
    <div className="out">
      <p className="out-title">
        {tag ? t('projetos.filtered', { tag, count: list.length }) : t('projetos.title', { count: list.length })}
      </p>

      {flags.tag === true && <p className="out-error">{t('projetos.tagMissing')}</p>}
      {tag && !list.length && <p className="out-error">{t('projetos.empty', { tag })}</p>}

      <div className="projects">
        {list.map((p) => (
          <article key={p.id} className="card project">
            <div className="project-media">
              {p.image ? (
                <img src={p.image} alt="" loading="lazy" decoding="async" width="640" height="400" />
              ) : (
                <pre className="project-ascii" aria-hidden="true">{p.ascii}</pre>
              )}
            </div>
            <div className="project-body">
              <h3 className="project-name">{pick(p.name)}</h3>
              <p className="project-desc">{pick(p.description)}</p>
              <ul className="badges" aria-label="Stack">
                {p.stack.map((s) => (
                  <li key={s} className="badge">
                    {s}
                  </li>
                ))}
              </ul>
              <p className="project-links">
                {p.repo && (
                  <a className="btn btn--ghost" href={p.repo} target="_blank" rel="noreferrer">
                    <FaGithub aria-hidden="true" /> {t('projetos.repo')}
                  </a>
                )}
                {p.demo && (
                  <a className="btn btn--ghost" href={p.demo} target="_blank" rel="noreferrer">
                    <FiExternalLink aria-hidden="true" /> {t('projetos.demo')}
                  </a>
                )}
                {!p.repo && !p.demo && <span className="out-dim">{t('projetos.private')}</span>}
              </p>
            </div>
          </article>
        ))}
      </div>

      <p className="out-muted">
        {t('projetos.tags')}{' '}
        {ALL_TAGS.map((tg) => (
          <span key={tg}>
            <CmdLink cmd={`${cmd} --tag ${tg}`}>{tg}</CmdLink>{' '}
          </span>
        ))}
      </p>
    </div>
  );
}
