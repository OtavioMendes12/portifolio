import { useTranslation } from 'react-i18next';
import { useLang } from '../data/pick';
import { experiences } from '../data/xp';
import { formatDuration, formatYm, monthsBetween } from '../data/dates';
import './Experience.css';

export default function Experience() {
  const { t } = useTranslation();
  const { pick, lang } = useLang();

  return (
    <div className="out">
      <p className="out-title">{t('xp.title')}</p>
      <ol className="timeline">
        {experiences.map((xp) => {
          const current = !xp.end;
          const period = `${formatYm(xp.start, lang)} – ${current ? t('xp.present') : formatYm(xp.end, lang)}`;
          const duration = formatDuration(monthsBetween(xp.start, xp.end), lang);
          const meta = [xp.mode && pick(xp.mode), xp.location].filter(Boolean).join(' · ');
          return (
            <li key={xp.id} className={`timeline-item${current ? ' timeline-item--current' : ''}`}>
              <article className="card xp-card">
                <header className="xp-head">
                  <h3 className="xp-role">{pick(xp.role)}</h3>
                  {current && <span className="badge badge--accent">{t('xp.current')}</span>}
                </header>
                <p className="xp-company">
                  {xp.company}
                  {xp.via && <span className="out-dim"> · {t('xp.via', { company: xp.via })}</span>}
                </p>
                <p className="xp-meta">
                  {period} · {duration}
                  {meta && <> · {meta}</>}
                </p>
                {xp.stack.length > 0 && (
                  <ul className="badges" aria-label={t('xp.stack')}>
                    {xp.stack.map((s) => (
                      <li key={s} className="badge">
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
                <ul className="xp-bullets">
                  {xp.bullets.map((b) => (
                    <li key={b.pt}>{pick(b)}</li>
                  ))}
                </ul>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
