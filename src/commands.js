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
    name: 'sobre',
    aliases: ['about', 'whoami'],
    component: lazy(() => import('./components/About.jsx')),
  },
  {
    name: 'experiencias',
    aliases: ['experience', 'xp'],
    component: lazy(() => import('./components/Experience.jsx')),
  },
  {
    name: 'projetos',
    aliases: ['projects'],
    component: lazy(() => import('./components/Projects.jsx')),
    flags: [{ name: 'tag', value: true }],
  },
  {
    name: 'habilidades',
    aliases: ['skills', 'stack'],
    component: lazy(() => import('./components/Skills.jsx')),
    flags: [{ name: 'lista', aliases: ['list'] }, { name: 'cards' }, { name: 'globo', aliases: ['globe'] }],
  },
  {
    name: 'curriculo',
    aliases: ['resume', 'cv'],
    component: lazy(() => import('./components/Resume.jsx')),
  },
  {
    name: 'contato',
    aliases: ['contact'],
    component: lazy(() => import('./components/Contact.jsx')),
  },
  {
    name: 'pergunta',
    aliases: ['ask', 'chat'],
    component: lazy(() => import('./components/Ask.jsx')),
    // com texto: pergunta única; sem texto: entra no modo conversa (sai com `sair`)
    run: ({ rest, chat }) => {
      if (rest) return { question: rest };
      chat.enter();
      return { mode: 'enter' };
    },
  },
  {
    name: 'github',
    aliases: ['git', 'repos'],
    component: lazy(() => import('./components/GitHub.jsx')),
  },
  {
    name: 'stats',
    aliases: ['ghstats'],
    component: lazy(() => import('./components/Stats.jsx')),
    flags: [{ name: 'repos' }, { name: 'tudo', aliases: ['all'] }],
  },
  {
    name: 'wakatime',
    aliases: ['time', 'waka'],
    component: lazy(() => import('./components/WakaTime.jsx')),
    flags: [{ name: 'agora', aliases: ['now'] }, { name: 'cards' }],
  },
  {
    name: 'spotify',
    aliases: ['music', 'musica', 'lastfm'],
    component: lazy(() => import('./components/Spotify.jsx')),
  },
  {
    name: 'titulos',
    aliases: ['trophies', 'titles'],
    component: lazy(() => import('./components/Titles.jsx')),
  },
  {
    name: 'campeonato',
    aliases: ['galo', 'atletico', 'matches'],
    component: lazy(() => import('./components/Campeonato.jsx')),
    flags: [{ name: 'todos', aliases: ['all'] }, { name: 'tabela', aliases: ['table', 'standings'] }],
  },
  {
    name: 'neofetch',
    aliases: ['fetch'],
    component: lazy(() => import('./components/Neofetch.jsx')),
  },
  {
    name: 'design',
    aliases: ['ds'],
    component: lazy(() => import('./components/DesignSystem.jsx')),
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
  // Easter eggs: fora do `ajuda` e do autocomplete.
  { name: 'sudo', hidden: true, component: lazy(() => import('./components/Sudo.jsx')) },
  { name: 'cafe', aliases: ['coffee'], hidden: true, component: lazy(() => import('./components/Cafe.jsx')) },
  { name: 'vamo', aliases: ['vamos'], hidden: true, component: lazy(() => import('./components/VamoGalo.jsx')) },
  { name: 'exit', aliases: ['quit', 'logout'], hidden: true, component: lazy(() => import('./components/Exit.jsx')) },
];

export const registry = createRegistry(commands);
