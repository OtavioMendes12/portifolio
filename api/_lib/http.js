/*
 * Helpers das Vercel Functions (assinatura Web: export function GET(request)).
 * Arquivos em api/_lib não viram rotas (prefixo "_").
 */
import { ALLOWED_ORIGINS } from '../../src/config/site.js';

const extraOrigins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // mesma origem / chamadas server-side não mandam Origin
  if ([...ALLOWED_ORIGINS, ...extraOrigins].includes(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  // previews da Vercel deste projeto
  const project = process.env.VERCEL_PROJECT_PRODUCTION_URL?.split('.')[0];
  return Boolean(project && new RegExp(`^https://${project}(-[a-z0-9-]+)?\\.vercel\\.app$`).test(origin));
};

export function corsHeaders(request) {
  const origin = request.headers.get('origin');
  return origin && isAllowedOrigin(origin)
    ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' }
    : {};
}

export function json(request, data, { status = 200, cacheSeconds = 0, headers = {} } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheSeconds
        ? `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${cacheSeconds * 3}`
        : 'no-store',
      ...corsHeaders(request),
      ...headers,
    },
  });
}

/** Bloqueia origens de fora. Devolve uma Response de erro ou null se ok. */
export function guard(request) {
  if (!isAllowedOrigin(request.headers.get('origin'))) {
    return json(request, { error: 'origin_not_allowed' }, { status: 403 });
  }
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request) });
  return null;
}

/** Cache em memória por instância (complementa o cache da CDN). */
const memory = new Map();
export async function cached(key, ttlMs, load) {
  const hit = memory.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await load();
  memory.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

export async function fetchJson(url, init = {}, timeoutMs = 8000) {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`upstream ${res.status} ${url}`);
  return res.json();
}
