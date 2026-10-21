/** "Currículo" → "curriculo": minúsculas e sem acento, para comparar comandos. */
export const normalize = (s = '') =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
