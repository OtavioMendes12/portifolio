import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '../data/pick';
import './Charts.css';

/**
 * Barras horizontais de uma série só (magnitude): uma cor (--accent),
 * valor sempre escrito em texto ao lado. Tooltip nativo por barra.
 */
export function BarList({ items, max }) {
  const top = max ?? Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="barlist">
      {items.map((i) => (
        <li key={i.label} className="barlist-row" title={`${i.label}: ${i.display}`}>
          <span className="barlist-label">{i.label}</span>
          <span className="barlist-track" aria-hidden="true">
            <span className="barlist-fill" style={{ width: `${Math.max(1.5, (i.value / top) * 100)}%` }} />
          </span>
          <span className="barlist-value">{i.display}</span>
        </li>
      ))}
    </ul>
  );
}

/** Nível 0–4 por quartis dos dias com contribuição (escala sequencial). */
function levels(days) {
  const counts = days.map(([, c]) => c).filter((c) => c > 0).sort((a, b) => a - b);
  const q = (p) => counts[Math.floor((counts.length - 1) * p)] ?? 0;
  const cuts = [q(0.25), q(0.5), q(0.75)];
  return (c) => (c === 0 ? 0 : c <= cuts[0] ? 1 : c <= cuts[1] ? 2 : c <= cuts[2] ? 3 : 4);
}

/** Heatmap de contribuições (semanas em colunas, dias em linhas). */
export function ContributionHeatmap({ weeks, total }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const scroller = useRef(null);
  const days = weeks.flat();
  const levelOf = levels(days);
  const fmt = new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

  // no celular, começa mostrando as semanas mais recentes
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <figure className="heatmap">
      <div ref={scroller} className="heatmap-scroll">
        <div className="heatmap-grid" role="img" aria-label={t('stats.heatmapLabel', { total })}>
          {weeks.map((week) =>
            week.map(([date, count]) => (
              <span
                key={date}
                className={`heatmap-cell lvl-${levelOf(count)}`}
                title={t('stats.cellTooltip', { count, date: fmt.format(new Date(date)) })}
              />
            )),
          )}
        </div>
      </div>
      <figcaption className="heatmap-legend">
        <span>{t('stats.less')}</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <span key={l} className={`heatmap-cell lvl-${l}`} aria-hidden="true" />
        ))}
        <span>{t('stats.more')}</span>
      </figcaption>
    </figure>
  );
}

/** Blocos de número grande (KPIs). */
export function StatTiles({ items }) {
  return (
    <ul className="stat-tiles">
      {items.map((s) => (
        <li key={s.label} className="card">
          <span className="stat-value">{s.value}</span>
          <span className="stat-label">{s.label}</span>
        </li>
      ))}
    </ul>
  );
}
