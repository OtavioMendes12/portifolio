/*
 * Registro de comandos. Para criar um comando novo:
 *   1. um componente em src/components/
 *   2. uma entrada aqui
 *   3. as chaves commands.<nome>.desc em src/locales/pt.json e en.json
 *
 * Campos:
 *   name       nome principal (PT)
 *   aliases    o 1º alias é o nome em inglês (aparece no `ajuda` em EN)
 *   component  saída renderizada (React.lazy → code splitting)
 *   flags      [{ name, aliases?, value? }]: --nome; value=true consome o próximo token
 *   args       argumentos sugeridos no Tab
 *   run(ctx)   ação síncrona antes de renderizar; o retorno vira props do componente
 *   noEntry    não adiciona nada ao histórico da tela (ex.: limpar)
 *   hidden     fora do `ajuda` e do autocomplete (easter eggs)
 */
import { lazy } from 'react';
import { createRegistry } from './terminal/registry';
import { normalize } from './terminal/normalize';
import { THEME_ALIASES } from './theme/themeContext';
import { LANGS } from './i18n';

export const commands = [
  {
    name: 'ajuda',
    aliases: ['help', '?'],
    component: lazy(() => import('./components/Help.jsx')),
  },
  {
    name: 'tema',
    aliases: ['theme'],
    component: lazy(() => import('./components/ThemeOutput.jsx')),
    flags: [{ name: 'galo' }, { name: 'escuro', aliases: ['dark'] }, { name: 'claro', aliases: ['light'] }, { name: 'matrix' }],
    run: ({ flags, args, theme }) => {
      const requested = Object.keys(flags)[0] ?? args[0];
      if (!requested) return { theme: theme.cycleTheme() };
      const target = THEME_ALIASES[normalize(requested)];
      return target ? { theme: theme.setTheme(target) } : { unknown: requested };
    },
  },
  {
    name: 'idioma',
    aliases: ['lang', 'language'],
    component: lazy(() => import('./components/LangOutput.jsx')),
    flags: [{ name: 'pt' }, { name: 'en' }],
    args: ['pt', 'en'],
    run: ({ flags, args, i18n }) => {
      const requested = flags.en ? 'en' : flags.pt ? 'pt' : args[0] && normalize(args[0]);
      const target = requested ?? (i18n.language === 'en' ? 'pt' : 'en');
      if (!LANGS.includes(target)) return { unknown: args[0] };
      i18n.changeLanguage(target);
      return { lang: target };
    },
  },
  {
    name: 'limpar',
    aliases: ['clear', 'cls'],
    noEntry: true,
    run: ({ clear }) => clear(),
  },
];

export const registry = createRegistry(commands);
