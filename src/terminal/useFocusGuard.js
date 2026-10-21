import { useEffect } from 'react';
import { getInput } from './inputBridge';

const INTERACTIVE = 'a, button, input, textarea, select, label, summary, canvas, [contenteditable], [data-keep-focus]';

/**
 * O react-terminal-ui foca o input escondido em QUALQUER clique na janela.
 * Isso roubaria o foco de formulários, links e jogos dentro da saída, e
 * apagaria seleções de texto. Nesses casos, desligamos o focus() da instância
 * só durante aquele clique.
 */
export function useFocusGuard() {
  useEffect(() => {
    const onClick = (e) => {
      const input = getInput();
      if (!input || e.target === input) return;
      const interactive = e.target.closest?.(INTERACTIVE);
      const selecting = String(window.getSelection?.() ?? '').length > 0;
      if (interactive || selecting) {
        input.focus = () => {};
        setTimeout(() => {
          delete input.focus;
        }, 0);
      }
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, []);
}
