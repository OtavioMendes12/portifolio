# Configurar as integrações (sem chave no código)

Nenhuma chave fica no código. As funções em `api/` leem tudo de **variáveis de ambiente**:

- **No seu computador:** arquivo `.env.local`, que nunca vai para o git.
- **Em produção:** painel da Vercel, em *Settings → Environment Variables*.

> Regra de ouro: segredo **nunca** começa com `VITE_`. O que começa com `VITE_` vai para o navegador e qualquer pessoa vê.
> As chaves da IA, do Spotify, do GitHub e do WakaTime ficam só no servidor (funções em `api/`).

Para ver o que já está configurado (mostra ✓/✗, nunca os valores):

```bash
npm run env:check
```

---

## 1. Chat de IA (`pergunta`), Anthropic

1. Acesse **console.anthropic.com**, depois *API Keys → Create Key*, e copie a chave (começa com `sk-ant-`).
2. Ainda no console, defina um **limite de gasto mensal** (*Billing → Limits*). O endpoint é público: o site já limita 10 perguntas a cada 10 min por IP, mas o teto no console é a garantia final.
3. Variável: `ANTHROPIC_API_KEY` (só servidor).

## 2. Spotify (`spotify` e a linha "Ouvindo agora")

1. Em **developer.spotify.com/dashboard**, clique em *Create app*:
   - *Redirect URI*: `http://127.0.0.1:8888/callback`
   - *APIs used*: marque **Web API**
2. Copie o **Client ID** e o **Client Secret** do app.
3. Gere o refresh token (uma vez só), na pasta do projeto:
   ```bash
   SPOTIFY_CLIENT_ID=seu_id SPOTIFY_CLIENT_SECRET=seu_secret node scripts/spotify-auth.mjs
   ```
   Abra o link que aparecer, autorize com a sua conta e copie o `SPOTIFY_REFRESH_TOKEN=...` impresso no terminal.
4. Variáveis (só servidor): `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`.

O token só pede permissão para **ler** o que está tocando e as últimas músicas. Ele não mexe na sua conta.

---

## Colocar no seu computador

```bash
cp .env.example .env.local   # depois preencha os valores no .env.local
npm run env:check            # confere
npm run dev                  # o dev server já lê o .env.local para as funções em /api
```

## Colocar na Vercel

**Pelo painel**, em *Project → Settings → Environment Variables*:

1. Adicione cada variável (nome e valor).
2. Marque **Production** e **Preview**. Marque **Development** só se for usar `vercel dev`.
3. **Faça um novo deploy** (*Deployments → ⋯ → Redeploy*). Variável nova só vale a partir do próximo deploy.

**Ou pela CLI** (`npm i -g vercel`, depois `vercel link` na pasta do projeto):

```bash
vercel env add ANTHROPIC_API_KEY production
vercel env add SPOTIFY_CLIENT_ID production
vercel env add SPOTIFY_CLIENT_SECRET production
vercel env add SPOTIFY_REFRESH_TOKEN production
vercel --prod   # novo deploy para valer
```

**Conferir depois do deploy:**

```bash
curl -s https://SEU-DOMINIO/api/spotify   # não deve responder {"error":"not_configured"}
```

No site, `pergunta oi` deve responder e `spotify` deve mostrar suas músicas.

---

## Todas as variáveis

| Variável | Onde | Para quê |
|---|---|---|
| `ANTHROPIC_API_KEY` | só servidor | chat de IA (`pergunta`) |
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` / `SPOTIFY_REFRESH_TOKEN` | só servidor | `spotify` e "Ouvindo agora" |
| `GITHUB_TOKEN` | só servidor | `stats` (gráfico de contribuições). Token *fine-grained* só de leitura |
| `WAKATIME_API_KEY` | só servidor | `wakatime` e "Codando agora" |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | público | `guestbook` e contador de visitas (rode `supabase/schema.sql` antes) |
| `VITE_EMAILJS_*` | público | formulário do `contato` |
| `VITE_LASTFM_API_KEY` | público | alternativa ao Spotify, via Last.fm |

Sem uma variável, a integração mostra "integração não configurada" e o resto do site funciona normalmente.

**Se uma chave vazar:** revogue no painel do serviço, gere outra, atualize na Vercel e faça redeploy.
