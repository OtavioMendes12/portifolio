import { storage } from './storage';

/** GET em /api/* com cache em sessionStorage (ttl em ms). Lança erro em falha. */
export async function getApi(path, { ttl = 0, signal } = {}) {
  const key = `api:${path}`;
  if (ttl) {
    const hit = storage.get(key, null, 'session');
    if (hit && Date.now() - hit.at < ttl) return hit.data;
  }
  const res = await fetch(path, { signal, headers: { Accept: 'application/json' } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error ?? `HTTP ${res.status}`);
    err.status = res.status;
    err.code = data.error;
    throw err;
  }
  if (ttl) storage.set(key, { at: Date.now(), data }, 'session');
  return data;
}
