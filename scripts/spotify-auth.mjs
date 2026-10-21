/*
 * Gera o SPOTIFY_REFRESH_TOKEN (rode uma vez só, na sua máquina).
 *
 * 1. Crie um app em https://developer.spotify.com/dashboard
 *    e adicione o Redirect URI:  http://127.0.0.1:8888/callback
 * 2. SPOTIFY_CLIENT_ID=... SPOTIFY_CLIENT_SECRET=... node scripts/spotify-auth.mjs
 * 3. Abra o link que aparecer, autorize, e copie o refresh token impresso
 *    para o .env.local e para as variáveis da Vercel.
 */
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';

const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = process.env;
if (!id || !secret) {
  console.error('Defina SPOTIFY_CLIENT_ID e SPOTIFY_CLIENT_SECRET antes de rodar.');
  process.exit(1);
}

const REDIRECT = 'http://127.0.0.1:8888/callback';
const state = randomBytes(12).toString('hex');
const authUrl = `https://accounts.spotify.com/authorize?${new URLSearchParams({
  client_id: id,
  response_type: 'code',
  redirect_uri: REDIRECT,
  scope: 'user-read-currently-playing user-read-recently-played',
  state,
})}`;

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT);
  if (url.pathname !== '/callback') return res.end();
  if (url.searchParams.get('state') !== state || !url.searchParams.get('code')) {
    res.end('Autorização falhou. Rode o script de novo.');
    return server.close();
  }
  const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'authorization_code', code: url.searchParams.get('code'), redirect_uri: REDIRECT }),
  });
  const data = await tokenRes.json();
  if (!data.refresh_token) {
    console.error('Resposta sem refresh token:', data);
    res.end('Falhou: veja o terminal.');
  } else {
    console.log(`\nSPOTIFY_REFRESH_TOKEN=${data.refresh_token}\n`);
    res.end('Pronto! Copie o token que apareceu no terminal.');
  }
  server.close();
});

server.listen(8888, '127.0.0.1', () => console.log(`Abra no navegador:\n\n${authUrl}\n`));
