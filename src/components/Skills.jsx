import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '../data/pick';
import { skillGroups, levelOf } from '../data/skills';
import { SKILL_META, shortName } from '../data/skillIcons';
import { experiences } from '../data/xp';
import { projects } from '../data/projects';
import { formatYm } from '../data/dates';
import { normalize } from '../terminal/normalize';
import { useTerminal } from '../terminal/TerminalContext';
import CmdLink from './CmdLink';
import Spinner from './Spinner';
import './Skills.css';

const SkillsGlobe = lazy(() => import('./SkillsGlobe.jsx'));

/** Todas as habilidades, da mais forte para a mais fraca, com ícone e cor. */
const ALL_SKILLS = skillGroups
  .flatMap((g) => g.items.map((s) => ({ ...s, group: g, short: shortName(s.name), ...(SKILL_META[s.name] ?? {}) })))
  .sort((a, b) => b.level - a.level);

const MODES = [
  { id: 'terminal', en: 'terminal' },
  { id: 'cards', en: 'cards' },
  { id: 'lista', en: 'list' },
  { id: 'globo', en: 'globe' },
];

const brandStyle = (s) => ({ '--brand': s.brand });

function findSkill(query) {
  const q = normalize(query);
  return (
    ALL_SKILLS.find((s) => normalize(s.short) === q) ??
    ALL_SKILLS.find((s) => normalize(s.short).startsWith(q) || normalize(s.name).includes(q))
  );
}

/** Ícone colorido da habilidade (cor da marca; tema claro/matrix usam --accent). */
export function SkillIcon({ skill, className = '' }) {
  const Icon = skill.Icon;
  return Icon ? <Icon className={`skill-icon ${className}`} style={brandStyle(skill)} aria-hidden="true" /> : null;
}

/** Envolve a habilidade num botão que escreve `habilidades --info <nome>`. */
function useInfoCmd() {
  const { lang } = useLang();
  return (skill) => `${lang === 'en' ? 'skills' : 'habilidades'} --info ${normalize(skill.short).replace(/\s+/g, '-')}`;
}

function LevelBadge({ pct }) {
  const { t } = useTranslation();
  const level = levelOf(pct);
  return <span className={`level-badge level-badge--${level}`}>{t(`habilidades.levels.${level}`)}</span>;
}

function TerminalView() {
  const { pick } = useLang();
  return (
    <div className="skills-tree">
      {skillGroups.map((g) => (
        <div key={g.id}>
          <p className="accent">{pick(g.title)}/</p>
          <ul>
            {g.items.map((s, i) => (
              <li key={s.name}>
                <span className="out-dim" aria-hidden="true">
                  {i === g.items.length - 1 ? '└── ' : '├── '}
                </span>
                {s.name} <span className="out-dim">{s.level}%</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ListView() {
  const { t } = useTranslation();
  const { type } = useTerminal();
  const infoCmd = useInfoCmd();
  return (
    <ul className="skill-list">
      {ALL_SKILLS.map((s) => (
        <li key={s.name}>
          <button type="button" className="skill-row" style={brandStyle(s)} onClick={() => type(infoCmd(s))}>
            <span className="skill-tile">
              <SkillIcon skill={s} />
            </span>
            <span className="skill-row-body">
              <span className="skill-row-head">
                <span className="skill-row-name">{s.short}</span>
                <LevelBadge pct={s.level} />
                <span className="skill-row-pct">{s.level}%</span>
              </span>
              <span className="skill-bar" role="img" aria-label={t('habilidades.levelPct', { pct: s.level })}>
                <span className="skill-bar-fill" style={{ width: `${s.level}%` }} />
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Ring({ pct }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <svg className="skill-ring" viewBox="0 0 80 80" aria-hidden="true">
      <circle className="skill-ring-track" cx="40" cy="40" r={r} />
      <circle className="skill-ring-fill" cx="40" cy="40" r={r} strokeDasharray={`${(pct / 100) * c} ${c}`} />
    </svg>
  );
}

function CardsView() {
  const { t } = useTranslation();
  const { type } = useTerminal();
  const infoCmd = useInfoCmd();
  return (
    <ul className="skill-cards">
      {ALL_SKILLS.map((s) => (
        <li key={s.name}>
          <button type="button" className="skill-card" style={brandStyle(s)} onClick={() => type(infoCmd(s))}>
            <span className="skill-card-ring">
              <Ring pct={s.level} />
              <SkillIcon skill={s} className="skill-card-icon" />
            </span>
            <span className="skill-card-name">{s.short}</span>
            <span className="skill-card-meta">
              {s.level}% · {t(`habilidades.levels.${levelOf(s.level)}`)}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function InfoView({ query }) {
  const { t } = useTranslation();
  const { pick, lang } = useLang();
  const skill = findSkill(query);
  if (!skill) return <p className="out-error">{t('habilidades.notFound', { name: query })}</p>;
  const key = normalize(skill.short);
  const uses = (stack) => stack.some((x) => normalize(x).includes(key) || key.includes(normalize(x)));
  const jobs = experiences.filter((x) => uses(x.stack));
  const work = projects.filter((p) => uses(p.stack));

  return (
    <div className="skill-info" style={brandStyle(skill)}>
      <div className="skill-info-head">
        <span className="skill-tile skill-tile--lg">
          <SkillIcon skill={skill} />
        </span>
        <div>
          <p className="skill-info-name">
            {skill.short} <LevelBadge pct={skill.level} />
          </p>
          <p className="out-dim">
            {pick(skill.group.title)} · {skill.level}%
          </p>
        </div>
      </div>
      <p className="out-title">{t('habilidades.usedAt')}</p>
      {jobs.length ? (
        <ul className="skill-info-list">
          {jobs.map((x) => (
            <li key={x.id}>
              {pick(x.role)} @ {x.company}{' '}
              <span className="out-dim">
                ({formatYm(x.start, lang)} – {x.end ? formatYm(x.end, lang) : t('xp.present')})
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="out-dim">{t('habilidades.noJobs')}</p>
      )}
      <p className="out-title">{t('habilidades.inProjects')}</p>
      {work.length ? (
        <ul className="skill-info-list">
          {work.map((p) => (
            <li key={p.id}>{pick(p.name)}</li>
          ))}
        </ul>
      ) : (
        <p className="out-dim">{t('habilidades.noProjects')}</p>
      )}
    </div>
  );
}

export default function Skills({ flags = {} }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const cmd = lang === 'en' ? 'skills' : 'habilidades';
  const info = typeof flags.info === 'string' ? flags.info.replace(/-/g, ' ') : null;
  const mode = flags.globo ? 'globo' : flags.cards ? 'cards' : flags.terminal ? 'terminal' : 'lista';

  return (
    <section className="skills-panel">
      <h2 className="skills-title">{t('habilidades.title')}</h2>
      {info ? (
        <InfoView query={info} />
      ) : (
        <>
          {mode === 'terminal' && <TerminalView />}
          {mode === 'lista' && <ListView />}
          {mode === 'cards' && <CardsView />}
          {mode === 'globo' && (
            <Suspense fallback={<Spinner />}>
              <SkillsGlobe skills={ALL_SKILLS} />
            </Suspense>
          )}
          {mode !== 'terminal' && <p className="skills-hint">{t(mode === 'globo' ? 'habilidades.globeHint' : 'habilidades.clickHint')}</p>}
        </>
      )}
      <p className="skills-modes">
        {t('habilidades.modes')}{' '}
        {MODES.map((m) => {
          const flag = lang === 'en' ? m.en : m.id;
          return (
            <CmdLink key={m.id} cmd={`${cmd} --${flag}`} className={!info && mode === m.id ? 'is-active' : ''}>
              --{flag}
            </CmdLink>
          );
        })}
      </p>
    </section>
  );
}
