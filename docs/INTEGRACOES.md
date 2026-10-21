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

## 1. Chat de IA (`pergunta`), OpenAI

1. Acesse https://platform.openai.com/api-keys e crie uma chave para o projeto.
2. Configure o faturamento/créditos da API no painel da OpenAI.
3. Na Vercel, adicione `OPENAI_API_KEY` em Settings → Environment Variables (Production e, se desejado, Preview).
4. Publique o código atualizado e faça um novo deploy para aplicar as variáveis.
5. Opcional: configure `OPENAI_MODEL` para usar outro modelo disponível na sua conta. Padrão: `gpt-6-luna`.

O chat usa a Responses API com streaming, `store: false` e limite de 2048 tokens de saída.
O limite de uso local continua sendo 10 perguntas por IP em 10 minutos e 300 por hora por instância.
A chave fica apenas no servidor; nunca use o prefixo `VITE_`.

## 2. Spotify (`spotify`)

O comando incorpora uma playlist pública pelo player do Spotify, sem API keys.
O ID da playlist fica em `src/config/spotify.js`.
Não é necessário configurar `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` ou `SPOTIFY_REFRESH_TOKEN` na Vercel.

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
vercel env add OPENAI_API_KEY production
vercel --prod   # novo deploy para valer
```

**Conferir depois do deploy:**

```bash
curl -s https://SEU-DOMINIO/api/github?view=stats   # não deve responder {"error":"not_configured"}
```

No site, `pergunta oi` deve responder e `spotify` deve mostrar o player da playlist.

---

## Todas as variáveis

| Variável | Onde | Para quê |
|---|---|---|
| `OPENAI_API_KEY` | só servidor | chat de IA (`pergunta`) |
| `GITHUB_TOKEN` | só servidor | `stats` (gráfico de contribuições). Token *fine-grained* só de leitura |
| `WAKATIME_API_KEY` | só servidor | `wakatime` e "Codando agora" |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | público | `guestbook` e contador de visitas (rode `supabase/schema.sql` antes) |
| `VITE_EMAILJS_*` | público | formulário do `contato` |

Sem uma variável, a integração mostra "integração não configurada" e o resto do site funciona normalmente.

**Se uma chave vazar:** revogue no painel do serviço, gere outra, atualize na Vercel e faça redeploy.
