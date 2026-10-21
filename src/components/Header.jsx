import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { TypeAnimation } from 'react-type-animation';
import {
  FaBriefcase, FaBuilding, FaEnvelope, FaFutbol, FaGithub, FaGraduationCap, FaLinkedin, FaLocationDot,
} from 'react-icons/fa6';
import { useTheme } from '../theme/themeContext';
import { useLang } from '../data/pick';
import { profile } from '../data/profile';
import { useReducedMotion } from '../lib/useReducedMotion';
import OtavioLogo from './OtavioLogo';
import CmdLink from './CmdLink';
import StatusLines from './StatusLines';
import './Header.css';

const BANNER = [
  ' ██████╗ ████████╗ █████╗ ██╗   ██╗██╗ ██████╗ ',
  '██╔═══██╗╚══██╔══╝██╔══██╗██║   ██║██║██╔═══██╗',
  '██║   ██║   ██║   ███████║██║   ██║██║██║   ██║',
  '██║   ██║   ██║   ██╔══██║╚██╗ ██╔╝██║██║   ██║',
  '╚██████╔╝   ██║   ██║  ██║ ╚████╔╝ ██║╚██████╔╝',
  ' ╚═════╝    ╚═╝   ╚═╝  ╚═╝  ╚═══╝  ╚═╝ ╚═════╝ ',
].join('\n');

function Brand() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { lang } = useLang();
  const reduced = useReducedMotion();
  const [shieldFailed, setShieldFailed] = useState(false);
  const typing = t('header.typing', { returnObjects: true });

  return (
    <div className="brand">
      <div className="brand-logo">
        {theme === 'galo' && !shieldFailed ? (
          <img src="/galo/escudo.svg" alt={t('header.shieldAlt')} width="96" height="116" onError={() => setShieldFailed(true)} />
        ) : (
          <OtavioLogo title={t('header.logoAlt')} />
        )}
      </div>
      <div className="brand-text">
        <h1 className="banner-wrap">
          <pre className="banner" aria-hidden="true">{BANNER}</pre>
          <span className="sr-only">Otávio Mendes</span>
        </h1>
        <p className="subtitle">
          <span className="sr-only">{typing.join(' · ')}</span>
          <span aria-hidden="true">
            <span className="subtitle-caret">&gt;</span>{' '}
            {reduced ? (
              typing.join(' · ')
            ) : (
              <TypeAnimation key={lang} sequence={typing.flatMap((s) => [s, 1800])} speed={55} deletionSpeed={70} repeat={Infinity} />
            )}
          </span>
        </p>
      </div>
    </div>
  );
}

function IntroCard() {
  const { t } = useTranslation();
  const { pick } = useLang();
  const items = [
    { Icon: FaBriefcase, label: t('card.role'), value: pick(profile.role) },
    {
      Icon: FaBuilding,
      label: t('card.company'),
      value: t('card.companyVia', { company: profile.company.name, via: profile.company.via }),
    },
    { Icon: FaGraduationCap, label: t('card.education'), value: pick(profile.education) },
    { Icon: FaFutbol, label: t('card.fan'), value: pick(profile.fan) },
    { Icon: FaLocationDot, label: t('card.city'), value: profile.city },
    { Icon: FaEnvelope, label: t('card.email'), value: profile.email, href: `mailto:${profile.email}` },
    { Icon: FaGithub, label: t('card.github'), value: `@${profile.github.user}`, href: profile.github.url },
    { Icon: FaLinkedin, label: t('card.linkedin'), value: profile.linkedin.label, href: profile.linkedin.url },
  ];
  return (
    <ul className="intro-card">
      {items.map(({ Icon, label, value, href }) => (
        <li key={label}>
          <Icon className="intro-icon" aria-hidden="true" />
          <span className="intro-label">{label}</span>
          {href ? (
            <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
              {value}
            </a>
          ) : (
            <span>{value}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Tela inicial: marca, boas-vindas, status ao vivo, cartão e dica. */
export default function Header() {
  const { t } = useTranslation();
  return (
    <header className="header">
      <Brand />
      <p className="welcome">
        <span className="welcome-sign">$</span> {t('header.welcome')}
      </p>
      <StatusLines />
      <IntroCard />
      <p className="hint">
        <Trans i18nKey="header.hint" components={{ help: <CmdLink />, ask: <CmdLink /> }} />
      </p>
    </header>
  );
}
