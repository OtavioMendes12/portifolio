/*
 * POST /api/ask  { messages: [{ role: 'user'|'assistant', content: string }] }
 * Chat "pergunte sobre mim" com o Claude, em streaming (NDJSON, um evento por linha):
 *   {t:'text', v}  pedaço da resposta
 *   {t:'reset'}    o modelo recusou no meio e o fallback assumiu: descarte o parcial
 *   {t:'done'} | {t:'refusal'} | {t:'error', code}
 * ANTHROPIC_API_KEY fica só no servidor.
 */
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from './_lib/persona.js';
import { clientIp, corsHeaders, guard, json } from './_lib/http.js';
import { rateLimit } from './_lib/rateLimit.js';

const MODEL = 'claude-opus-5-5';
const MAX_QUESTION = 500;
const MAX_TURNS = 8; // pares pergunta/resposta mantidos no histórico
const MAX_ANSWER_CHARS = 4000;
const SYSTEM = buildSystemPrompt();

let client = null;

/** Valida o histórico vindo do navegador (entrada não confiável). */
function sanitize(raw) {
  if (!Array.isArray(raw) || !raw.length) return null;
  const msgs = raw
    .slice(-(MAX_TURNS * 2 + 1))
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, m.role === 'user' ? MAX_QUESTION : MAX_ANSWER_CHARS).trim() }))
    .filter((m) => m.content);
  while (msgs.length && msgs[0].role !== 'user') msgs.shift();
  return msgs.length && msgs[msgs.length - 1].role === 'user' ? msgs : null;
}

const errorCode = (err) => {
  if (err instanceof Anthropic.AuthenticationError) return 'not_configured';
  if (err instanceof Anthropic.RateLimitError) return 'busy';
  if (err instanceof Anthropic.APIError) return 'upstream';
  return 'upstream';
};

export async function POST(request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  if (!process.env.ANTHROPIC_API_KEY) return json(request, { error: 'not_configured' });

  let body;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: 'bad_request' }, { status: 400 });
  }
  const last = Array.isArray(body?.messages) ? body.messages[body.messages.length - 1] : null;
  if (typeof last?.content === 'string' && last.content.length > MAX_QUESTION) {
    return json(request, { error: 'too_long', max: MAX_QUESTION }, { status: 413 });
  }
  const messages = sanitize(body?.messages);
  if (!messages) return json(request, { error: 'bad_request' }, { status: 400 });

  const ip = clientIp(request);
  const perIp = rateLimit(`ip:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  const global = perIp.ok ? rateLimit('global', { limit: 300, windowMs: 60 * 60 * 1000 }) : perIp;
  if (!perIp.ok || !global.ok) {
    const retryAfter = (perIp.ok ? global : perIp).retryAfter;
    return json(request, { error: 'rate_limited', retryAfter }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  client ??= new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 2048, // respostas curtas por instrução; o teto limita custo num endpoint público
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default', // recusa de um classificador → o servidor tenta o modelo recomendado
    output_config: { effort: 'low' }, // chat simples: menos tokens e menos latência
    system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
    messages,
  });

  const encoder = new TextEncoder();
  const out = new ReadableStream({
    async start(controller) {
      const send = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_start' && event.content_block.type === 'fallback') {
            send({ t: 'reset' });
          } else if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            send({ t: 'text', v: event.delta.text });
          }
        }
        const final = await stream.finalMessage();
        send(final.stop_reason === 'refusal' ? { t: 'refusal' } : { t: 'done', truncated: final.stop_reason === 'max_tokens' });
      } catch (err) {
        if (!(err instanceof Anthropic.APIUserAbortError)) {
          console.error('[ask]', err);
          send({ t: 'error', code: errorCode(err) });
        }
      }
      controller.close();
    },
    cancel() {
      stream.abort(); // visitante saiu/limpou a tela: para de gerar (e de gastar)
    },
  });

  return new Response(out, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no',
      ...corsHeaders(request),
    },
  });
}

export function OPTIONS(request) {
  return guard(request) ?? new Response(null, { status: 204 });
}
