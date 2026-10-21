import { normalize } from './normalize';
import { levenshtein } from './levenshtein';

/**
 * Índice dos comandos: busca por nome/alias (sem acento), nomes visíveis
 * para autocomplete e sugestão do mais parecido.
 */
export function createRegistry(list) {
  const index = new Map();
  for (const c of list) {
    for (const n of [c.name, ...(c.aliases ?? [])]) index.set(normalize(n), c);
  }
  const visible = list.filter((c) => !c.hidden);
  const visibleNames = [...new Set(visible.flatMap((c) => [c.name, ...(c.aliases ?? [])]))].filter((n) => /^[a-z]/i.test(n));

  return {
    all: list,
    visible,
    find: (name) => index.get(normalize(name ?? '')) ?? null,
    names: () => visibleNames,
    /** Em inglês, o primeiro alias é o nome principal (ajuda → help). */
    displayName: (c, lang) => (lang === 'en' && c.aliases?.[0]) || c.name,
    suggest(name) {
      const n = normalize(name);
      let best = null;
      let bestDist = Infinity;
      for (const c of visible) {
        for (const cand of [c.name, ...(c.aliases ?? [])]) {
          const d = levenshtein(n, normalize(cand));
          if (d < bestDist) {
            bestDist = d;
            best = c;
          }
        }
      }
      const limit = Math.max(1, Math.min(3, Math.floor(n.length / 2)));
      return best && bestDist <= limit ? best : null;
    },
  };
}
