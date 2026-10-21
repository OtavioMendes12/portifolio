import { useEffect } from 'react';
import { getInput } from './inputBridge';

/** Ajusta o input escondido da lib: rótulo, sem autocorreção e teclado "enviar" no celular. */
export function useTerminalA11y(label) {
  useEffect(() => {
    const input = getInput();
    if (!input) return;
    input.setAttribute('aria-label', label);
    input.removeAttribute('placeholder');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('enterkeyhint', 'send');
  }, [label]);
}
