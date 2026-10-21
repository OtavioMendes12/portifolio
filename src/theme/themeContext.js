import { createContext, useContext } from 'react';

export const THEMES = ['galo', 'escuro', 'claro', 'matrix'];

// Nomes aceitos em flags/argumentos → tema
export const THEME_ALIASES = {
  galo: 'galo',
  atletico: 'galo',
  escuro: 'escuro',
  dark: 'escuro',
  claro: 'claro',
  light: 'claro',
  matrix: 'matrix',
};

export const ThemeContext = createContext(null);

export const useTheme = () => useContext(ThemeContext);

/** Lê um token do tema atual, ex.: readToken('--accent') */
export const readToken = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();
