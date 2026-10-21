// localStorage/sessionStorage com try/catch: modo privado ou storage bloqueado não quebram nada.
const area = (kind) => (kind === 'session' ? window.sessionStorage : window.localStorage);

export const storage = {
  get(key, fallback = null, kind = 'local') {
    try {
      const raw = area(kind).getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set(key, value, kind = 'local') {
    try {
      area(kind).setItem(key, JSON.stringify(value));
    } catch {
      /* sem storage: segue sem persistir */
    }
  },
  remove(key, kind = 'local') {
    try {
      area(kind).removeItem(key);
    } catch {
      /* idem */
    }
  },
};
