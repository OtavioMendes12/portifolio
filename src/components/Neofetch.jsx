import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dependencies, devDependencies } from '../../package.json';
import { useTheme } from '../theme/themeContext';
import { useTerminal } from '../terminal/TerminalContext';
import { imageToBraille, svgElementToDataUrl } from '../lib/braille';
import OtavioLogo from './OtavioLogo';
import './Neofetch.css';

const DEPS = Object.keys(dependencies).length + Object.keys(devDependencies).length;
const PALETTE = ['--busy', '--success', '--warn', '--info', '--accent', '--terminal-chrome', '--text-muted', '--surface', '--border', '--text-dim', '--text'];

const uptime = (ms, lang) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const unit = lang === 'en' ? ['h', 'min', 's'] : ['h', 'min', 's'];
  return [h && `${h}${unit[0]}`, (h || m) && `${m}${unit[1]}`, `${sec}${unit[2]}`].filter(Boolean).join(' ');
};

function useUptime() {
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    const id = setInterval(() => setNow(performance.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** Arte em braille: escudo 3D (tema galo) ou a logo. */
function useArt(theme, logoRef) {
  const [art, setArt] = useState('');
  useEffect(() => {
    let alive = true;
    const fromLogo = () => imageToBraille(svgElementToDataUrl(logoRef.current.querySelector('svg')), { cols: 20, rows: 10 });
    // tema galo: foto de frente do escudo 3D → braille; senão, a logo
    const source =
      theme === 'galo'
        ? import('../lib/crest3d')
            .then((m) => m.crestSnapshot())
            .then((url) => imageToBraille(url, { cols: 20, rows: 11, minLuma: 0.5 }))
            .catch(fromLogo)
        : fromLogo();
    source.then((a) => alive && setArt(a)).catch(() => alive && setArt(''));
    return () => {
      alive = false;
    };
  }, [theme, logoRef]);
  return art;
}

export default function Neofetch() {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { registry } = useTerminal();
  const logoRef = useRef(null);
  const art = useArt(theme, logoRef);
  const now = useUptime();
  const user = t('ui.prompt').split(':')[0];

  const rows = [
    ['OS', 'GaloOS x86_64'],
    ['Host', 'Arena MRV · Belo Horizonte'],
    ['Kernel', '1908-galo'],
    ['Uptime', uptime(now, i18n.language)],
    ['Packages', t('neofetch.packages', { commands: registry.visible.length, deps: DEPS })],
    ['Shell', 'react-terminal-ui'],
    ['DE', 'React 19 · WM: Vite'],
    ['Theme', t(`themes.${theme}`)],
    ['CPU', t('neofetch.cpu')],
    ['Time', 'Clube Atlético Mineiro'],
  ];

  return (
    <div className="neofetch">
      <div ref={logoRef} hidden>
        <OtavioLogo size={64} />
      </div>
      <pre className="neofetch-art" aria-hidden="true">{art}</pre>
      <div className="neofetch-info">
        <p className="accent">{user}</p>
        <p className="out-dim" aria-hidden="true">
          {'-'.repeat(user.length)}
        </p>
        <dl>
          {rows.map(([k, v]) => (
            <div key={k} className="neofetch-row">
              <dt>{k}:</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <p className="neofetch-palette" aria-hidden="true">
          {PALETTE.map((v) => (
            <span key={v} style={{ background: `var(${v})` }} />
          ))}
        </p>
      </div>
    </div>
  );
}
