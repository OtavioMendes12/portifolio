import { getSupabase } from './integrations';
import { storage } from './storage';

export const LIMITS = { name: [2, 40], message: [2, 280] };

// Mesmo filtro da trigger no banco (supabase/schema.sql); aqui só para responder na hora.
// Palavras inteiras (\b): 'computador', 'disputa', 'viaduto' passam.
const BLOCKED = /\b(porra|caralh\w*|buceta|putas?|putos?|merda|foder|fod[ae]|fodase|viad[oa]s?|arrombad[oa]s?|desgracad[oa]s?|fuck\w*|shit|bitch|cunt|nigg\w*|fag|faggot)\b/;
export const hasBlockedWords = (text) =>
  BLOCKED.test(text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase());

/** id anônimo do navegador, usado só para o rate limit no banco. */
function clientId() {
  let id = storage.get('guestbook-client');
  if (!id) {
    id = crypto.randomUUID();
    storage.set('guestbook-client', id);
  }
  return id;
}

const notConfigured = () => Object.assign(new Error('not_configured'), { code: 'not_configured' });

export async function listMessages(limit = 20) {
  const supabase = await getSupabase();
  if (!supabase) throw notConfigured();
  const { data, error } = await supabase
    .from('guestbook')
    .select('id, name, message, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function signGuestbook({ name, message }) {
  const supabase = await getSupabase();
  if (!supabase) throw notConfigured();
  // sem .select(): o anon não pode ler client_id de volta
  const { error } = await supabase.from('guestbook').insert({ name: name.trim(), message: message.trim(), client_id: clientId() });
  if (error) {
    const code = /aguarde|muitas/i.test(error.message) ? 'rate_limited' : /linguagem/i.test(error.message) ? 'blocked' : 'failed';
    throw Object.assign(new Error(error.message), { code });
  }
}
