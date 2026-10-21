import { getApi } from './api';

const TEN_MIN = 10 * 60 * 1000;

export const getFutebol = (view = 'resumo', opts = {}) => getApi(`/api/futebol?view=${view}`, { ttl: TEN_MIN, ...opts });

const COMPETITIONS = {
  'bra.1': { pt: 'Brasileirão', en: 'Brasileirão' },
  'bra.copa_do_brazil': { pt: 'Copa do Brasil', en: 'Copa do Brasil' },
  'bra.camp.mineiro': { pt: 'Campeonato Mineiro', en: 'Minas Gerais State League' },
  'conmebol.libertadores': { pt: 'Copa Libertadores', en: 'Copa Libertadores' },
  'conmebol.sudamericana': { pt: 'Copa Sul-Americana', en: 'Copa Sudamericana' },
  'conmebol.recopa': { pt: 'Recopa Sul-Americana', en: 'Recopa Sudamericana' },
  'bra.supercopa_do_brazil': { pt: 'Supercopa do Brasil', en: 'Brazilian Supercup' },
};

const PHASES_PT = {
  Final: 'Final',
  Semifinals: 'Semifinal',
  Quarterfinals: 'Quartas de final',
  'Round of 16': 'Oitavas de final',
  'Round of 32': 'Fase de 32',
  'Fifth Round': '5ª fase',
  'Fourth Round': '4ª fase',
  'Third Round': '3ª fase',
  'Second Round': '2ª fase',
  'First Round': '1ª fase',
  'Group Stage': 'Fase de grupos',
  'Knockout Round Playoffs': 'Playoffs',
  'Regular Season': 'Primeira fase',
  'Playoffs - Final': 'Final',
  'Playoffs - Semifinals': 'Semifinal',
};

export const competitionName = (ev, lang) => COMPETITIONS[ev.league]?.[lang] ?? ev.competition ?? '';

/** Fase em PT/EN. No Brasileirão a ESPN manda só o nome da temporada: escondemos. */
export const phaseName = (ev, lang) => {
  if (!ev.phase || /serie a|brasileir/i.test(ev.phase)) return '';
  return lang === 'pt' ? (PHASES_PT[ev.phase.trim()] ?? ev.phase) : ev.phase;
};

/** "2nd Leg - Atlético-MG lead 3-0 on aggregate" → "Jogo de volta · Atlético-MG vence por 3-0 no agregado" */
export const noteText = (note, lang) => {
  if (!note || lang === 'en') return note ?? '';
  return note
    .replace('1st Leg', 'Jogo de ida')
    .replace('2nd Leg', 'Jogo de volta')
    .replace(/Tied on aggregate/, 'empate no agregado')
    .replace(/(\S+) lead (\d+-\d+) on aggregate/, '$1 vence por $2 no agregado')
    .replace(/(\S+) win (\d+-\d+) on aggregate/, '$1 venceu por $2 no agregado')
    .replace(/(\S+) (?:win|advance) (\d+-\d+) on penalties/, '$1 venceu por $2 nos pênaltis')
    .replaceAll(' - ', ' · ');
};

const fmt = (lang, opts) => new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pt-BR', { timeZone: 'America/Sao_Paulo', ...opts });

export const formatMatchDate = (ev, lang, { short = false } = {}) => {
  const d = new Date(ev.date);
  const day = fmt(lang, short ? { day: '2-digit', month: '2-digit' } : { weekday: 'short', day: '2-digit', month: 'short' }).format(d);
  if (!ev.timeValid) return `${day} · ${lang === 'en' ? 'time TBD' : 'horário a definir'}`;
  return `${day} · ${fmt(lang, { hour: '2-digit', minute: '2-digit' }).format(d)}`;
};

/** Lado do Galo e do adversário num jogo. */
export const sides = (ev, teamId) => {
  const galo = ev.home?.id === teamId ? ev.home : ev.away;
  const rival = ev.home?.id === teamId ? ev.away : ev.home;
  return { galo, rival };
};
