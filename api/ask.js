/*
 * POST /api/ask  { messages: [{ role: 'user'|'assistant', content: string }] }
 * Chat "pergunte sobre mim" com a OpenAI, em streaming (NDJSON, um evento por linha):
 *   {t:'text', v}  pedaço da resposta
 *   {t:'done'} | {t:'refusal'} | {t:'error', code}
 * OPENAI_API_KEY fica só no servidor.
 */
import OpenAI from 'openai';
import { buildSystemPrompt } from './_lib/persona.js';
import { clientIp, corsHeaders, guard, json } from './_lib/http.js';
import { rateLimit } from './_lib/rateLimit.js';

const MODEL = process.env.OPENAI_MODEL || 'gpt-6-luna';
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
  const code = err?.code ?? err?.error?.code;
  if (code === 'model_not_found') return 'model_unavailable';
  if (['insufficient_quota', 'credit_balance_exhausted', 'organization_spend_limit_exceeded',
    'project_spend_limit_exceeded', 'organization_usage_limit_exceeded', 'usage_limit_exceeded'].includes(code)
    || err?.type === 'insufficient_quota') return 'quota';
  if (err instanceof OpenAI.AuthenticationError || err?.status === 401) return 'not_configured';
  if (err instanceof OpenAI.PermissionDeniedError || err?.status === 403) return 'access_denied';
  if (err instanceof OpenAI.RateLimitError || code === 'rate_limit_exceeded') return 'busy';
  return 'upstream';
};

// Somente metadados: nunca registrar chave, histórico ou headers da requisição.
const logError = (err) => console.error('[ask]', {
  model: MODEL,
  status: err?.status,
  code: err?.code,
  type: err?.type,
  param: err?.param,
  requestId: err?.request_id,
});

export async function POST(request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  if (!process.env.OPENAI_API_KEY) return json(request, { error: 'not_configured' });

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

  client ??= new OpenAI({ maxRetries: 0, timeout: 50_000 });
  const abort = new AbortController();
  let cancelled = false;
  const onAbort = () => abort.abort();
  request.signal.addEventListener('abort', onAbort, { once: true });
  if (request.signal.aborted) abort.abort();

  const encoder = new TextEncoder();
  const out = new ReadableStream({
    async start(controller) {
      const send = (event) => {
        if (!cancelled) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      let terminal = false;
      let refused = false;
      try {
        const stream = await client.responses.create({
          model: MODEL,
          instructions: SYSTEM,
          input: messages,
          max_output_tokens: 2048,
          store: false,
          stream: true,
        }, { signal: abort.signal });
        for await (const event of stream) {
          if (event.type === 'response.output_text.delta') {
            send({ t: 'text', v: event.delta });
          } else if (event.type === 'response.refusal.delta') {
            refused = true;
          } else if (event.type === 'response.completed' || event.type === 'response.incomplete') {
            const reason = event.response.incomplete_details?.reason;
            if (refused || reason === 'content_filter') send({ t: 'refusal' });
            else if (event.type === 'response.completed' || reason === 'max_output_tokens') {
              send({ t: 'done', truncated: reason === 'max_output_tokens' });
            } else send({ t: 'error', code: 'upstream' });
            terminal = true;
            break;
          } else if (event.type === 'response.failed' || event.type === 'error') {
            const error = event.response?.error ?? event;
            logError(error);
            send({ t: 'error', code: errorCode(error) });
            terminal = true;
            break;
          }
        }
        if (!terminal && !cancelled) send({ t: 'error', code: 'upstream' });
      } catch (err) {
        if (!cancelled && !request.signal.aborted) {
          logError(err);
          send({ t: 'error', code: errorCode(err) });
        }
      } finally {
        request.signal.removeEventListener('abort', onAbort);
        if (!cancelled) controller.close();
      }
    },
    cancel() {
      cancelled = true;
      abort.abort();
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
