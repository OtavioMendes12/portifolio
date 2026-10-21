/**
 * Pergunta ao /api/ask e entrega a resposta aos pedaços.
 * onEvent recebe { t: 'text'|'reset'|'done'|'refusal'|'error', ... }.
 * Erros HTTP (limite, não configurado...) viram { t: 'error', code }.
 */
export async function askStream(messages, { signal, onEvent }) {
  const res = await fetch('/api/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal,
  });
  const type = res.headers.get('content-type') ?? '';
  if (!res.ok || type.includes('application/json')) {
    const data = await res.json().catch(() => ({}));
    onEvent({ t: 'error', code: data.error ?? 'upstream', retryAfter: data.retryAfter, max: data.max });
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf('\n')) > -1) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) onEvent(JSON.parse(line));
    }
  }
}
