// Mostra quais integrações estão configuradas no .env/.env.local (nunca imprime os valores).
// Uso: npm run env:check
import { existsSync, readFileSync } from 'node:fs';

const env = { ...process.env };
for (const file of ['.env', '.env.local']) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && m[2] && !m[2].startsWith('#')) env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const GROUPS = [
  ['GitHub stats', ['GITHUB_TOKEN']],
  ['WakaTime', ['WAKATIME_API_KEY']],
  ['Supabase (guestbook, visitas)', ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']],
  ['EmailJS (contato)', ['VITE_EMAILJS_SERVICE_ID', 'VITE_EMAILJS_TEMPLATE_ID_FOR_ME', 'VITE_EMAILJS_PUBLIC_KEY']],
];

for (const [name, keys] of GROUPS) {
  const missing = keys.filter((k) => !env[k]);
  console.log(`${missing.length ? '✗' : '✓'} ${name}${missing.length ? `  (falta: ${missing.join(', ')})` : ''}`);
}

// segredo com prefixo VITE_ vazaria para o navegador
const leaked = Object.keys(env).filter((k) => /^VITE_.*(SECRET|TOKEN|SPOTIFY_CLIENT_SECRET|WAKATIME|GITHUB)/.test(k) && env[k]);
if (leaked.length) {
  console.log(`\n⚠ Estas variáveis parecem segredo mas começam com VITE_ (iriam para o navegador): ${leaked.join(', ')}`);
  process.exitCode = 1;
}
console.log('\nGuia: docs/INTEGRACOES.md');
