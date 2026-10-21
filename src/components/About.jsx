import { useTranslation } from 'react-i18next';
import { useLang } from '../data/pick';
import { about } from '../data/about';
import { experiences, careerStart } from '../data/xp';
import { projects } from '../data/projects';
import { programmingLanguages, spokenLanguages } from '../data/skills';
import { monthsBetween } from '../data/dates';
import CmdLink from './CmdLink';
import './About.css';

export default function About() {
  const { t } = useTranslation();
  const { pick, lang } = useLang();
  const years = Math.floor(monthsBetween(careerStart, null) / 12);

  const stats = [
    { value: `${years}+`, label: t('sobre.stats.years') },
    { value: experiences.length, label: t('sobre.stats.companies') },
    { value: projects.length, label: t('sobre.stats.projects') },
    { value: programmingLanguages.length, label: t('sobre.stats.languages') },
  ];

  return (
    <div className="out about">
      <p>{pick(about.intro)}</p>

      <ul className="about-stats">
        {stats.map((s) => (
          <li key={s.label} className="card">
            <span className="about-stat-value">{s.value}</span>
            <span className="about-stat-label">{s.label}</span>
          </li>
        ))}
      </ul>

      <section>
        <p className="out-title">{t('sobre.journey')}</p>
        <ol className="about-journey">
          {about.journey.map((step) => (
            <li key={step.pt}>{pick(step)}</li>
          ))}
        </ol>
      </section>

      <section>
        <p className="out-title">{t('sobre.offline')}</p>
        <ul className="about-list">
          {about.offline.map((item) => (
            <li key={item.pt}>{pick(item)}</li>
          ))}
          <li>
            {t('sobre.spoken')}: {spokenLanguages.map((l) => pick(l)).join(' · ')}
          </li>
        </ul>
      </section>

      <p className="out-muted">
        {t('sobre.more')} <CmdLink cmd={lang === 'en' ? 'experience' : 'experiencias'} />{' '}
        · <CmdLink cmd={lang === 'en' ? 'projects' : 'projetos'} /> ·{' '}
        <CmdLink cmd={lang === 'en' ? 'skills' : 'habilidades'} /> · <CmdLink cmd={lang === 'en' ? 'trophies' : 'titulos'} />
      </p>
    </div>
  );
}
