/*
 * Rate limit em memória (janela deslizante por chave). É por instância da
 * função: em escala vira "melhor esforço", o que basta para um portfólio.
 * Para um limite global, troque por Redis/Upstash.
 */
const buckets = new Map();

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.delete(buckets.keys().next().value); // não cresce sem limite
  return { ok: true, remaining: limit - hits.length };
}
