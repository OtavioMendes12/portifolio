/*
 * GET /api/futebol?view=resumo|todos|tabela
 * Proxy da API pública da ESPN para o Atlético-MG, com cache de 10 min.
 * ID descoberto em site.api.espn.com/apis/site/v2/sports/soccer/bra.1/teams
 * → 7632 "Atlético-MG" (CAM). Atenção: 3458 é o Athletico-PR.
 */
import { cached, fetchJson, guard, json } from './_lib/http.js';

export const TEAM_ID = '7632';
const SITE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const TTL = 10 * 60 * 1000;

const logoOf = (team) => team.logos?.[0]?.href ?? team.logo ?? null;
const scoreOf = (c) => (typeof c.score === 'object' ? c.score?.displayValue : c.score) ?? null;

export function normalizeEvent(e) {
  const comp = e.competitions?.[0] ?? {};
  const side = (c) => ({
    id: c.team.id,
    name: c.team.shortDisplayName ?? c.team.displayName,
    abbr: c.team.abbreviation,
    logo: logoOf(c.team),
    score: scoreOf(c),
    winner: c.winner ?? null,
  });
  const home = comp.competitors?.find((c) => c.homeAway === 'home');
  const away = comp.competitors?.find((c) => c.homeAway === 'away');
  const galoHome = home?.team?.id === TEAM_ID;
  const status = comp.status?.type ?? {};
  let result = null;
  if (status.completed && home && away) {
    const [gf, ga] = galoHome ? [+scoreOf(home), +scoreOf(away)] : [+scoreOf(away), +scoreOf(home)];
    result = gf > ga ? 'V' : gf < ga ? 'D' : 'E';
  }
  return {
    id: e.id,
    date: e.date,
    timeValid: e.timeValid !== false,
    league: e.league?.slug ?? null,
    competition: e.league?.name ?? null,
    phase: e.seasonType?.name ?? null,
    note: comp.notes?.[0]?.headline ?? null,
    venue: comp.venue?.fullName ?? null,
    city: comp.venue?.address?.city ?? null,
    state: status.state ?? 'pre', // pre | in | post
    detail: status.shortDetail ?? null,
    home: home ? side(home) : null,
    away: away ? side(away) : null,
    galoHome,
    result,
  };
}

const fixtures = () =>
  cached('fixtures', TTL, async () => {
    const data = await fetchJson(`${SITE}/all/teams/${TEAM_ID}/schedule?fixture=true`);
    return (data.events ?? []).map(normalizeEvent).sort((a, b) => a.date.localeCompare(b.date));
  });

const results = () =>
  cached('results', TTL, async () => {
    const data = await fetchJson(`${SITE}/all/teams/${TEAM_ID}/schedule`);
    return (data.events ?? [])
      .map(normalizeEvent)
      .filter((e) => e.state === 'post')
      .sort((a, b) => b.date.localeCompare(a.date));
  });

const standings = () =>
  cached('standings', TTL, async () => {
    const data = await fetchJson('https://site.api.espn.com/apis/v2/sports/soccer/bra.1/standings');
    const group = data.children?.[0];
    const stat = (entry, name) => entry.stats.find((s) => s.name === name)?.displayValue ?? '';
    return {
      season: data.season?.displayName ?? group?.standings?.season ?? null,
      rows: (group?.standings?.entries ?? [])
        .map((entry) => ({
          rank: Number(stat(entry, 'rank')),
          id: entry.team.id,
          name: entry.team.shortDisplayName ?? entry.team.displayName,
          abbr: entry.team.abbreviation,
          logo: logoOf(entry.team),
          played: stat(entry, 'gamesPlayed'),
          wins: stat(entry, 'wins'),
          ties: stat(entry, 'ties'),
          losses: stat(entry, 'losses'),
          goalDiff: stat(entry, 'pointDifferential'),
          points: stat(entry, 'points'),
        }))
        .sort((a, b) => a.rank - b.rank),
    };
  });

export async function GET(request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const view = new URL(request.url).searchParams.get('view') ?? 'resumo';

  try {
    if (view === 'tabela') return json(request, { teamId: TEAM_ID, ...(await standings()) }, { cacheSeconds: 600 });
    if (view === 'todos') return json(request, { teamId: TEAM_ID, fixtures: await fixtures() }, { cacheSeconds: 600 });

    const [upcoming, past] = await Promise.all([fixtures(), results().catch(() => [])]);
    const live = upcoming.find((e) => e.state === 'in');
    const next = upcoming.filter((e) => e.state !== 'post');
    return json(
      request,
      { teamId: TEAM_ID, live: live ?? null, next: next.slice(0, 5), last: past[0] ?? null },
      { cacheSeconds: live ? 60 : 600 },
    );
  } catch (err) {
    console.error('[futebol]', err);
    return json(request, { error: 'upstream_unavailable' }, { status: 502 });
  }
}

export function OPTIONS(request) {
  return guard(request) ?? new Response(null, { status: 204 });
}
