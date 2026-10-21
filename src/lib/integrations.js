import { getApi } from './api';
import { storage } from './storage';
import { LASTFM_API_KEY, LASTFM_USER, isLastfmConfigured } from '../config/lastfm';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '../config/supabase';

const MIN = 60 * 1000;

const notConfigured = () => Object.assign(new Error('not_configured'), { code: 'not_configured' });

export const getGithub = (view, opts) => getApi(`/api/github?view=${view}`, { ttl: 30 * MIN, ...opts });
export const getWakatime = (view, opts) => getApi(`/api/wakatime?view=${view}`, { ttl: view === 'agora' ? 2 * MIN : 30 * MIN, ...opts });

/** Last.fm: últimas faixas (a 1ª pode estar tocando agora). */
export async function getRecentTracks({ limit = 10, signal } = {}) {
  if (!isLastfmConfigured()) throw notConfigured();
  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.search = new URLSearchParams({
    method: 'user.getrecenttracks',
    user: LASTFM_USER,
    api_key: LASTFM_API_KEY,
    format: 'json',
    limit: String(limit),
  });
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`lastfm ${res.status}`);
  const data = await res.json();
  return (data.recenttracks?.track ?? []).slice(0, limit + 1).map((t) => ({
    name: t.name,
    artist: t.artist?.['#text'] ?? t.artist?.name ?? '',
    album: t.album?.['#text'] ?? '',
    url: t.url,
    image: t.image?.find((i) => i.size === 'medium')?.['#text'] || null,
    nowPlaying: t['@attr']?.nowplaying === 'true',
    playedAt: t.date?.uts ? Number(t.date.uts) * 1000 : null,
  }));
}

/** Clima atual em BH (Open-Meteo, sem chave). */
export async function getWeather({ signal } = {}) {
  const hit = storage.get('weather', null, 'session');
  if (hit && Date.now() - hit.at < 15 * MIN) return hit.data;
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=-19.92&longitude=-43.94&current=temperature_2m,weather_code,is_day&timezone=America%2FSao_Paulo';
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const { current } = await res.json();
  const data = { temp: Math.round(current.temperature_2m), code: current.weather_code, isDay: current.is_day === 1 };
  storage.set('weather', { at: Date.now(), data }, 'session');
  return data;
}

// Códigos WMO → descrição curta
const WMO = [
  [[0], { pt: 'céu limpo', en: 'clear sky' }],
  [[1, 2], { pt: 'poucas nuvens', en: 'partly cloudy' }],
  [[3], { pt: 'nublado', en: 'overcast' }],
  [[45, 48], { pt: 'neblina', en: 'fog' }],
  [[51, 53, 55, 56, 57], { pt: 'garoa', en: 'drizzle' }],
  [[61, 63, 65, 66, 67, 80, 81, 82], { pt: 'chuva', en: 'rain' }],
  [[71, 73, 75, 77, 85, 86], { pt: 'neve', en: 'snow' }],
  [[95, 96, 99], { pt: 'tempestade', en: 'thunderstorm' }],
];
export const weatherText = (code, lang) => WMO.find(([codes]) => codes.includes(code))?.[1][lang] ?? '';

let supabasePromise = null;
/** Cliente Supabase carregado sob demanda (a lib é grande). null se não configurado. */
export function getSupabase() {
  if (!isSupabaseConfigured()) return Promise.resolve(null);
  supabasePromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } }),
  );
  return supabasePromise;
}

/** Contador de visitas: incrementa 1x por sessão, depois só lê. */
export async function getVisits() {
  const supabase = await getSupabase();
  if (!supabase) throw notConfigured();
  const cachedCount = storage.get('visits', null, 'session');
  if (cachedCount !== null) return cachedCount;
  const { data, error } = await supabase.rpc('increment_visits');
  if (error) throw error;
  storage.set('visits', data, 'session');
  return data;
}

export const isNotConfigured = (error) => error?.code === 'not_configured';
