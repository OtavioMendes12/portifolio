/*
 * GET /api/wakatime?view=semana|agora
 * - semana: tempo de código dos últimos 7 dias por linguagem, projeto e editor.
 * - agora: se estou codando (último heartbeat < 15 min), projeto, linguagem, editor e duração da sessão.
 * Exige WAKATIME_API_KEY (só no servidor).
 */
import { cached, fetchJson, guard, json } from './_lib/http.js';

const BASE = 'https://wakatime.com/api/v1/users/current';
const GAP = 15 * 60; // segundos sem heartbeat = sessão encerrada (padrão do WakaTime)

const auth = () => ({ Authorization: `Basic ${Buffer.from(process.env.WAKATIME_API_KEY).toString('base64')}` });

const pickList = (list = [], n = 6) =>
  list.slice(0, n).map((x) => ({ name: x.name, seconds: Math.round(x.total_seconds), text: x.text, percent: x.percent }));

const week = () =>
  cached('waka:week', 30 * 60 * 1000, async () => {
    const { data } = await fetchJson(`${BASE}/stats/last_7_days`, { headers: auth() });
    return {
      total: data.human_readable_total_including_other_language ?? data.human_readable_total,
      totalSeconds: Math.round(data.total_seconds_including_other_language ?? data.total_seconds ?? 0),
      dailyAverage: data.human_readable_daily_average,
      dailyAverageSeconds: Math.round(data.daily_average_including_other_language ?? data.daily_average ?? 0),
      languages: pickList(data.languages, 8),
      projects: pickList(data.projects, 6),
      editors: pickList(data.editors, 3),
      upToDate: data.is_up_to_date !== false,
    };
  });

const todayInBrazil = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

const now = () =>
  cached('waka:now', 2 * 60 * 1000, async () => {
    const date = todayInBrazil();
    const [beats, today] = await Promise.all([
      fetchJson(`${BASE}/heartbeats?date=${date}`, { headers: auth() }),
      fetchJson(`${BASE}/status_bar/today`, { headers: auth() }).catch(() => null),
    ]);
    const list = (beats.data ?? []).sort((a, b) => a.time - b.time);
    const last = list[list.length - 1];
    const nowSec = Date.now() / 1000;
    const coding = Boolean(last && nowSec - last.time < GAP);
    let start = last?.time ?? nowSec;
    for (let i = list.length - 2; i >= 0 && coding; i--) {
      if (start - list[i].time > GAP) break;
      start = list[i].time;
    }
    return {
      coding,
      project: last?.project ?? null,
      language: last?.language ?? null,
      editor: today?.data?.editors?.[0]?.name ?? null,
      sessionMinutes: coding ? Math.max(1, Math.round((last.time - start) / 60)) : 0,
      today: today?.data?.grand_total?.text ?? null,
      lastSeen: last ? new Date(last.time * 1000).toISOString() : null,
    };
  });

export async function GET(request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  if (!process.env.WAKATIME_API_KEY) return json(request, { error: 'not_configured' });
  const view = new URL(request.url).searchParams.get('view') ?? 'semana';
  if (!['semana', 'agora'].includes(view)) return json(request, { error: 'not_allowed' }, { status: 400 });
  try {
    const data = view === 'agora' ? await now() : await week();
    return json(request, data, { cacheSeconds: view === 'agora' ? 60 : 1800 });
  } catch (err) {
    console.error('[wakatime]', err);
    return json(request, { error: 'upstream_unavailable' }, { status: 502 });
  }
}
