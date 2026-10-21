/*
 * GET /api/spotify → { tracks: [...] } (a 1ª pode estar tocando agora)
 * Lê a sua conta do Spotify com um refresh token (gere uma vez com
 * `node scripts/spotify-auth.mjs`). Segredos só no servidor:
 *   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN
 */
import { cached, fetchJson, guard, json } from './_lib/http.js';

let token = { value: null, expires: 0 };

async function accessToken() {
  if (token.value && token.expires > Date.now() + 30_000) return token.value;
  const basic = Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');
  const data = await fetchJson('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: process.env.SPOTIFY_REFRESH_TOKEN }),
  });
  token = { value: data.access_token, expires: Date.now() + data.expires_in * 1000 };
  return token.value;
}

const toTrack = (item, extra = {}) => ({
  name: item.name,
  artist: item.artists?.map((a) => a.name).join(', ') ?? '',
  album: item.album?.name ?? '',
  url: item.external_urls?.spotify ?? null,
  image: item.album?.images?.at(-1)?.url ?? null,
  ...extra,
});

const load = () =>
  cached('spotify', 30 * 1000, async () => {
    const auth = { Authorization: `Bearer ${await accessToken()}` };
    const [nowRes, recent] = await Promise.all([
      fetch('https://api.spotify.com/v1/me/player/currently-playing', { headers: auth, signal: AbortSignal.timeout(8000) }),
      fetchJson('https://api.spotify.com/v1/me/player/recently-played?limit=10', { headers: auth }),
    ]);
    // 204 = nada tocando
    const now = nowRes.status === 200 ? await nowRes.json() : null;
    const tracks = (recent.items ?? []).map((i) => toTrack(i.track, { nowPlaying: false, playedAt: Date.parse(i.played_at) }));
    if (now?.is_playing && now.item?.type === 'track') tracks.unshift(toTrack(now.item, { nowPlaying: true, playedAt: null }));
    return tracks;
  });

export async function GET(request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) return json(request, { error: 'not_configured' });
  try {
    return json(request, { source: 'spotify', tracks: await load() }, { cacheSeconds: 30 });
  } catch (err) {
    console.error('[spotify]', err);
    return json(request, { error: 'upstream_unavailable' }, { status: 502 });
  }
}
