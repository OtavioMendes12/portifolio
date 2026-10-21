import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { THEMES, useTheme } from '../theme/themeContext';
import CmdLink from './CmdLink';
import './DesignSystem.css';

const COLOR_TOKENS = [
  '--bg-page', '--bg-terminal', '--surface', '--border', '--text', '--text-muted', '--text-dim',
  '--accent', '--accent-hover', '--on-accent', '--terminal-chrome', '--success', '--warn', '--info', '--busy',
];
const SPACES = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6'];
const RADII = ['--radius-1', '--radius-2', '--radius-3', '--radius-4', '--radius-pill'];
const SIZES = ['--fs-xs', '--fs-sm', '--fs-base', '--fs-lg'];
const BREAKPOINTS = [
  ['900px', 'cards: imagem acima do texto / image above text'],
  ['768px', 'fonte 0.9rem / font 0.9rem'],
  ['480px', 'fonte 0.85rem / font 0.85rem'],
];

/** Lê os tokens ao vivo com getComputedStyle (um frame depois, para pegar o tema novo). */
function useTokens(names, theme) {
  const [values, setValues] = useState({});
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const css = getComputedStyle(document.documentElement);
      setValues(Object.fromEntries(names.map((n) => [n, css.getPropertyValue(n).trim()])));
    });
    return () => cancelAnimationFrame(id);
  }, [names, theme]);
  return values;
}

export default function DesignSystem() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const colors = useTokens(COLOR_TOKENS, theme);
  const measures = useTokens([...SPACES, ...RADII, ...SIZES, '--font-mono'], theme);

  return (
    <div className="out ds">
      <p className="out-title">{t('design.title')}</p>

      <section>
        <h3 className="ds-h">{t('design.themes')}</h3>
        <div className="ds-themes">
          {THEMES.map((id) => (
            <div key={id} data-theme={id} className={`ds-theme${id === theme ? ' ds-theme--active' : ''}`}>
              <span className="ds-theme-name">
                {t(`themes.${id}`)}
                {id === theme && ' ●'}
              </span>
              <span className="ds-theme-sample">visitante@galo:~$ ajuda</span>
              <span className="ds-theme-swatches" aria-hidden="true">
                {['--accent', '--text', '--text-muted', '--success', '--warn', '--info', '--busy'].map((v) => (
                  <span key={v} style={{ background: `var(${v})` }} />
                ))}
              </span>
              <CmdLink cmd={`tema --${id}`} className="ds-theme-apply" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="ds-h">{t('design.tokens', { theme: t(`themes.${theme}`) })}</h3>
        <ul className="ds-tokens">
          {COLOR_TOKENS.map((n) => (
            <li key={n}>
              <span className="ds-chip" style={{ background: `var(${n})` }} aria-hidden="true" />
              <code>{n}</code>
              <span className="out-dim">{colors[n]}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="ds-h">{t('design.type')}</h3>
        <p className="out-muted">{measures['--font-mono']}</p>
        {SIZES.map((n) => (
          <p key={n} style={{ fontSize: `var(${n})` }}>
            <code className="out-dim">{n}</code> Aa Bb 0123 {'{ } => != ~$'} ★
          </p>
        ))}
      </section>

      <section>
        <h3 className="ds-h">{t('design.spacing')}</h3>
        <ul className="ds-scale">
          {SPACES.map((n) => (
            <li key={n}>
              <code>{n}</code>
              <span className="ds-bar" style={{ width: `var(${n})` }} />
              <span className="out-dim">{measures[n]}</span>
            </li>
          ))}
        </ul>
        <ul className="ds-radii">
          {RADII.map((n) => (
            <li key={n}>
              <span className="ds-radius" style={{ borderRadius: `var(${n})` }} />
              <code className="out-dim">{measures[n]}</code>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="ds-h">{t('design.breakpoints')}</h3>
        <ul className="ds-bps">
          {BREAKPOINTS.map(([bp, desc]) => (
            <li key={bp}>
              <code className="accent">{bp}</code> <span className="out-muted">{desc}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
