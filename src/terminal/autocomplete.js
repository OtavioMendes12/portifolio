import { normalize } from './normalize';

const commonPrefix = (words) =>
  words.reduce((acc, w) => {
    let i = 0;
    while (i < acc.length && i < w.length && acc[i] === w[i]) i++;
    return acc.slice(0, i);
  });

function finish(head, current, matches) {
  if (!matches.length) return { value: head + current, options: [] };
  if (matches.length === 1) return { value: `${head}${matches[0]} `, options: matches };
  const lcp = commonPrefix(matches);
  return { value: head + (lcp.length > current.length ? lcp : current), options: matches };
}

/**
 * Completa a linha como um shell: nome do comando no 1º token,
 * flags (--x) e argumentos conhecidos nos seguintes.
 */
export function complete(value, registry) {
  const endsWithSpace = /\s$/.test(value);
  const tokens = value.trim().split(/\s+/).filter(Boolean);

  if (!tokens.length) return { value, options: registry.visible.map((c) => c.name) };

  if (tokens.length === 1 && !endsWithSpace) {
    const prefix = normalize(tokens[0]);
    const matches = registry.names().filter((n) => normalize(n).startsWith(prefix));
    return finish(value.slice(0, value.length - tokens[0].length), tokens[0], matches);
  }

  const cmd = registry.find(tokens[0]);
  if (!cmd) return { value, options: [] };
  const current = endsWithSpace ? '' : tokens[tokens.length - 1];
  const head = value.slice(0, value.length - current.length);
  const used = new Set(tokens.slice(1, endsWithSpace ? undefined : -1));
  const candidates = [
    ...(cmd.flags ?? []).flatMap((f) => [f.name, ...(f.aliases ?? [])].map((n) => `--${n}`)),
    ...(cmd.args ?? []),
  ].filter((c) => !used.has(c));
  const matches = candidates.filter((c) => c.startsWith(current));
  return finish(head, current, matches);
}
