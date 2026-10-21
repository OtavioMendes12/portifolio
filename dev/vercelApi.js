/*
 * Só para `npm run dev`: serve api/*.js (Vercel Functions, assinatura Web)
 * dentro do Vite, sem precisar do `vercel dev`. Em produção quem roda é a Vercel.
 */
import { Readable } from 'node:stream';

export function vercelApi() {
  return {
    name: 'vercel-api-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const match = url.pathname.match(/^\/api\/([a-z0-9-]+)$/i);
        if (!match) return next();
        try {
          const mod = await server.ssrLoadModule(`/api/${match[1]}.js`);
          const handler = mod[req.method] ?? mod.default?.fetch;
          if (!handler) {
            res.statusCode = 405;
            return res.end('method not allowed');
          }
          const hasBody = !['GET', 'HEAD'].includes(req.method);
          const request = new Request(url, {
            method: req.method,
            headers: Object.entries(req.headers).filter(([, v]) => typeof v === 'string'),
            body: hasBody ? Readable.toWeb(req) : undefined,
            duplex: hasBody ? 'half' : undefined,
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((v, k) => res.setHeader(k, v));
          if (!response.body) return res.end();
          Readable.fromWeb(response.body).pipe(res);
        } catch (err) {
          server.ssrFixStacktrace?.(err);
          console.error('[api dev]', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'dev_handler_failed' }));
        }
      });
    },
  };
}
