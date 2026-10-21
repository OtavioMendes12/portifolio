import { existsSync } from 'node:fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { SITE_URL } from './src/config/site.js';
import { vercelApi } from './dev/vercelApi.js';

// Troca %SITE_URL% no index.html (canonical e Open Graph).
const siteUrlPlugin = () => ({
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
});

// Papel de parede do tema galo: basta salvar public/galo/wallpaper.(webp|jpg|png).
// Se existir, o CSS passa a usá-lo; se não, ficam só as listras (sem requisição 404).
const galoWallpaperPlugin = () => ({
  name: 'galo-wallpaper',
  transformIndexHtml(html) {
    const file = ['webp', 'jpg', 'jpeg', 'png'].map((ext) => `galo/wallpaper.${ext}`).find((f) => existsSync(`public/${f}`));
    if (!file) return html;
    return html.replace('</head>', `    <style>[data-theme='galo']{--page-wallpaper:url('/${file}')}</style>\n  </head>`);
  },
});

export default defineConfig(({ mode }) => {
  // No dev, as funções em /api leem segredos (sem VITE_) do .env.local via process.env.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''), process.env);

  return {
    plugins: [react(), siteUrlPlugin(), galoWallpaperPlugin(), vercelApi()],
    // deps carregadas só por comandos lazy: pré-otimizadas para o dev não recarregar a página no 1º uso
    optimizeDeps: {
      include: ['@react-pdf-viewer/core', '@emailjs/browser', '@supabase/supabase-js'],
    },
  };
});
