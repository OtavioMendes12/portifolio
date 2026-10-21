const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "há 3 dias" / "3 days ago" */
export function relativeTime(date, lang) {
  const diff = (new Date(date).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang === 'en' ? 'en' : 'pt-BR', { numeric: 'auto' });
  for (const [unit, sec] of UNITS) {
    if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit);
  }
  return rtf.format(0, 'minute');
}
