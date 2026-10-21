import { normalize } from './normalize';

/** Quebra a linha em tokens, respeitando aspas: tema "--galo" → ['tema', '--galo'] */
export function tokenize(input) {
  const tokens = [];
  let cur = '';
  let quote = null;
  let quoted = false;
  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"') {
      quote = ch;
      quoted = true;
    } else if (/\s/.test(ch)) {
      if (cur || quoted) tokens.push(cur);
      cur = '';
      quoted = false;
    } else {
      cur += ch;
    }
  }
  if (cur || quoted) tokens.push(cur);
  return tokens;
}

/**
 * Interpreta uma linha de comando.
 * Flags: --cards (true), --tag java ou --tag=java (valor, se a flag declara `value: true`).
 * Aliases de flag viram o nome canônico (--dark → escuro).
 * `rest` é o texto cru depois do nome do comando (para texto livre, ex.: pergunta).
 */
export function parseCommand(raw, find) {
  const input = (raw ?? '').trim();
  const tokens = tokenize(input);
  const [name = '', ...rest] = tokens;
  const cmd = name ? find(name) : null;
  const spec = cmd?.flags ?? [];
  const flags = {};
  const args = [];

  for (let i = 0; i < rest.length; i++) {
    const tok = rest[i];
    if (tok.startsWith('--') && tok.length > 2) {
      const eq = tok.indexOf('=');
      const key = normalize(eq > -1 ? tok.slice(2, eq) : tok.slice(2));
      let value = eq > -1 ? tok.slice(eq + 1) : undefined;
      const def = spec.find((f) => f.name === key || f.aliases?.includes(key));
      if (value === undefined && def?.value && i + 1 < rest.length && !rest[i + 1].startsWith('--')) {
        value = rest[++i];
      }
      flags[def?.name ?? key] = value ?? true;
    } else {
      args.push(tok);
    }
  }

  const restText = input.slice(input.indexOf(name) + name.length).trim();
  return { raw: input, name, cmd, args, flags, rest: restText };
}
