import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { storage } from '../lib/storage';
import { ThemeContext, THEMES, readToken } from './themeContext';

const initialTheme = () => {
  const fromHtml = document.documentElement.dataset.theme;
  return THEMES.includes(fromHtml) ? fromHtml : 'galo';
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(initialTheme);
  const current = useRef(theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    storage.set('theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', readToken('--bg-page'));
  }, [theme]);

  const setTheme = useCallback((next) => {
    const valid = THEMES.includes(next) ? next : 'galo';
    current.current = valid;
    setThemeState(valid);
    return valid;
  }, []);

  // galo → escuro → claro → matrix → galo
  const cycleTheme = useCallback(() => {
    const idx = THEMES.indexOf(current.current);
    return setTheme(THEMES[(idx + 1) % THEMES.length]);
  }, [setTheme]);

  const value = useMemo(() => ({ theme, setTheme, cycleTheme }), [theme, setTheme, cycleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
