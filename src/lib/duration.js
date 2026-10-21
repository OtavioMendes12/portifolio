/** 40000 s → "11 h 6 min" (pt) / "11h 6m" (en) */
export function formatSeconds(seconds, lang) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (lang === 'en') return h ? `${h}h ${m}m` : `${m}m`;
  return h ? `${h} h ${m} min` : `${m} min`;
}
