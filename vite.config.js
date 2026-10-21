import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { SITE_URL } from './src/config/site.js';

// Troca %SITE_URL% no index.html (canonical e Open Graph).
const siteUrlPlugin = () => ({
  name: 'site-url',
  transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', SITE_URL),
});

export default defineConfig({
  plugins: [react(), siteUrlPlugin()],
  // deps carregadas só por comandos lazy: pré-otimizadas para o dev não recarregar a página no 1º uso
  optimizeDeps: {
    include: ['@react-pdf-viewer/core', '@emailjs/browser', '@supabase/supabase-js'],
  },
});
