const MONTHS = {
  pt: ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const parse = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return { y, m };
};

const today = () => {
  const d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
};

/** '2024-04' → 'abr/2024' (pt) ou 'Apr 2024' (en) */
export const formatYm = (ym, lang) => {
  const { y, m } = parse(ym);
  return lang === 'en' ? `${MONTHS.en[m - 1]} ${y}` : `${MONTHS.pt[m - 1]}/${y}`;
};

/** Meses entre duas datas 'AAAA-MM', contando o mês inicial. end null = hoje. */
export const monthsBetween = (start, end) => {
  const a = parse(start);
  const b = end ? parse(end) : today();
  return Math.max(1, (b.y - a.y) * 12 + (b.m - a.m) + 1);
};

export const formatDuration = (months, lang) => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (lang === 'en') {
    return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo${m > 1 ? 's' : ''}`].filter(Boolean).join(' ');
  }
  return [y && `${y} ano${y > 1 ? 's' : ''}`, m && `${m} ${m > 1 ? 'meses' : 'mês'}`].filter(Boolean).join(' e ');
};
