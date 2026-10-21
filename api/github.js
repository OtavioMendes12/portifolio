/*
 * GET /api/github?view=repos|stats
 * Proxy da API do GitHub, preso ao usuário de src/config/github.js.
 * - repos: REST, funciona sem token (limite menor).
 * - stats: GraphQL (contribuições, linguagens, totais), exige GITHUB_TOKEN.
 */
import { GITHUB_USER } from '../src/config/github.js';
import { cached, fetchJson, guard, json } from './_lib/http.js';

const TTL = 30 * 60 * 1000;
const VIEWS = new Set(['repos', 'stats']);

const headers = () => ({
  Accept: 'application/vnd.github+json',
  'User-Agent': 'otavio-portfolio',
  'X-GitHub-Api-Version': '2022-11-28',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
});

const repos = () =>
  cached('gh:repos', TTL, async () => {
    const list = await fetchJson(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100&type=owner`, {
      headers: headers(),
    });
    return list
      .filter((r) => !r.fork && !r.archived)
      .map((r) => ({
        name: r.name,
        description: r.description,
        url: r.html_url,
        homepage: r.homepage || null,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        updatedAt: r.pushed_at ?? r.updated_at,
        topics: r.topics ?? [],
      }));
  });

const QUERY = `query($login: String!) {
  user(login: $login) {
    followers { totalCount }
    repositories(ownerAffiliations: OWNER, isFork: false, first: 100, orderBy: { field: STARGAZERS, direction: DESC }) {
      totalCount
      nodes {
        name url stargazerCount forkCount description
        primaryLanguage { name }
        languages(first: 10, orderBy: { field: SIZE, direction: DESC }) { edges { size node { name } } }
      }
    }
    contributionsCollection {
      totalCommitContributions totalPullRequestContributions totalIssueContributions
      contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
    }
  }
}`;

const stats = () =>
  cached('gh:stats', TTL, async () => {
    const res = await fetchJson('https://api.github.com/graphql', {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { login: GITHUB_USER } }),
    });
    if (res.errors?.length) throw new Error(res.errors[0].message);
    const u = res.data.user;
    const bytes = {};
    for (const repo of u.repositories.nodes) {
      for (const { size, node } of repo.languages.edges) bytes[node.name] = (bytes[node.name] ?? 0) + size;
    }
    const totalBytes = Object.values(bytes).reduce((a, b) => a + b, 0) || 1;
    const c = u.contributionsCollection;
    return {
      totals: {
        contributions: c.contributionCalendar.totalContributions,
        commits: c.totalCommitContributions,
        pullRequests: c.totalPullRequestContributions,
        issues: c.totalIssueContributions,
        repos: u.repositories.totalCount,
        stars: u.repositories.nodes.reduce((a, r) => a + r.stargazerCount, 0),
        followers: u.followers.totalCount,
      },
      calendar: c.contributionCalendar.weeks.map((w) => w.contributionDays.map((d) => [d.date, d.contributionCount])),
      languages: Object.entries(bytes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, size]) => ({ name, percent: Math.round((size / totalBytes) * 1000) / 10 })),
      topRepos: u.repositories.nodes.slice(0, 6).map((r) => ({
        name: r.name,
        url: r.url,
        stars: r.stargazerCount,
        forks: r.forkCount,
        language: r.primaryLanguage?.name ?? null,
        description: r.description,
      })),
    };
  });

export async function GET(request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  const params = new URL(request.url).searchParams;
  const view = params.get('view') ?? 'repos';
  const user = params.get('user');
  if (!VIEWS.has(view) || (user && user.toLowerCase() !== GITHUB_USER.toLowerCase())) {
    return json(request, { error: 'not_allowed' }, { status: 400 });
  }
  if (view === 'stats' && !process.env.GITHUB_TOKEN) {
    return json(request, { error: 'not_configured' });
  }
  try {
    const data = view === 'stats' ? await stats() : await repos();
    return json(request, { user: GITHUB_USER, [view]: data }, { cacheSeconds: 1800 });
  } catch (err) {
    console.error('[github]', err);
    return json(request, { error: 'upstream_unavailable' }, { status: 502 });
  }
}
