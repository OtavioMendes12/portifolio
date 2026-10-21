import { lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useLang } from '../data/pick';
import { skillGroups } from '../data/skills';
import CmdLink from './CmdLink';
import Spinner from './Spinner';
import './Skills.css';

const SkillsGlobe = lazy(() => import('./SkillsGlobe.jsx'));

const bar = (level) => '█'.repeat(level) + '░'.repeat(5 - level);

function SkillList() {
  const { pick } = useLang();
  return (
    <div className="skills-tree">
      {skillGroups.map((g) => (
        <div key={g.id}>
          <p className="accent">{pick(g.title)}</p>
          <ul>
            {g.items.map((s, i) => (
              <li key={s.name}>
                <span className="out-dim" aria-hidden="true">
                  {i === g.items.length - 1 ? '└─ ' : '├─ '}
                </span>
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SkillCards() {
  const { t } = useTranslation();
  const { pick } = useLang();
  return (
    <div className="card-grid">
      {skillGroups.map((g) => (
        <section key={g.id} className="card skill-card">
          <h3 className="skill-card-title">{pick(g.title)}</h3>
          <ul>
            {g.items.map((s) => (
              <li key={s.name} className="skill-row">
                <span className="skill-name">{s.name}</span>
                <span className="skill-bar" role="img" aria-label={t('habilidades.level', { level: s.level })}>
                  {bar(s.level)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function Skills({ flags = {} }) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const cmd = lang === 'en' ? 'skills' : 'habilidades';
  const mode = flags.globo ? 'globo' : flags.cards ? 'cards' : 'lista';

  return (
    <div className="out">
      <p className="out-title">{t('habilidades.title')}</p>
      {mode === 'lista' && <SkillList />}
      {mode === 'cards' && <SkillCards />}
      {mode === 'globo' && (
        <Suspense fallback={<Spinner />}>
          <SkillsGlobe />
        </Suspense>
      )}
      <p className="out-muted">
        {t('habilidades.modes')} <CmdLink cmd={`${cmd} --${lang === 'en' ? 'list' : 'lista'}`} /> ·{' '}
        <CmdLink cmd={`${cmd} --cards`} /> · <CmdLink cmd={`${cmd} --${lang === 'en' ? 'globe' : 'globo'}`} />
      </p>
    </div>
  );
}
