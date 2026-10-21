import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiMoon, FiSun } from 'react-icons/fi';
import { GiRooster } from 'react-icons/gi';
import { FaCapsules } from 'react-icons/fa6';
import { useTheme } from '../theme/themeContext';
import { LANGS } from '../i18n';
import './TitleBar.css';

const THEME_BUTTONS = [
  { id: 'claro', Icon: FiSun },
  { id: 'escuro', Icon: FiMoon },
  { id: 'galo', Icon: GiRooster },
  { id: 'matrix', Icon: FaCapsules, className: 'theme-btn--pill' },
];

function Clock() {
  const { t } = useTranslation();
  const fmt = useMemo(
    () => new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }),
    [],
  );
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000);
    return () => clearInterval(id);
  }, []);
  const time = fmt.format(now);
  return (
    <time className="clock" dateTime={now.toISOString()} aria-label={t('ui.clock', { time })}>
      {time}
      <span className="clock-zone" aria-hidden="true">
        BSB
      </span>
    </time>
  );
}

/** Barra da janela (substitui os botões padrão do react-terminal-ui). */
export default function TitleBar({ redBtnCallback, yellowBtnCallback, greenBtnCallback }) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const lang = i18n.language;

  return (
    <div className="titlebar">
      <div className="titlebar-dots">
        <button type="button" className="dot dot--red" aria-label={t('ui.windowClose')} onClick={redBtnCallback} />
        <button type="button" className="dot dot--yellow" aria-label={t('ui.windowMin')} onClick={yellowBtnCallback} />
        <button type="button" className="dot dot--green" aria-label={t('ui.windowMax')} onClick={greenBtnCallback} />
      </div>

      <span className="titlebar-title">{t('ui.title')}</span>

      <div className="titlebar-actions">
        <div className="theme-buttons" role="group" aria-label={t('ui.themeGroup')}>
          {THEME_BUTTONS.map(({ id, Icon, className = '' }) => (
            <button
              key={id}
              type="button"
              className={`icon-btn theme-btn ${className}`}
              aria-label={t('ui.themeButton', { name: t(`themes.${id}`) })}
              aria-pressed={theme === id}
              title={t(`themes.${id}`)}
              onClick={() => setTheme(id)}
            >
              <Icon aria-hidden="true" />
            </button>
          ))}
        </div>
        <Clock />
        <div className="lang-switch">
          {LANGS.map((l, i) => (
            <span key={l}>
              {i > 0 && <span className="lang-sep" aria-hidden="true">|</span>}
              <button
                type="button"
                className="lang-btn"
                aria-pressed={lang === l}
                aria-label={t('ui.langSwitch', { lang: l === 'pt' ? 'Português' : 'English' })}
                onClick={() => i18n.changeLanguage(l)}
              >
                {l.toUpperCase()}
              </button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
