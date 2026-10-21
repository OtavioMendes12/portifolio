import { useEffect, useEffectEvent } from 'react';
import { getInput, isEditable, focusInput, writeInput, revealPrompt } from './inputBridge';

/**
 * Teclado do terminal, em fase de captura no document: assim tratamos
 * Enter, ↑/↓ e Tab antes do onKeyDown interno do react-terminal-ui.
 */
export function useTerminalKeys({ history, onSubmit, onTab, onClear, disabled }) {
  const handle = useEffectEvent((e) => {
    if (disabled) return;
    const input = getInput();
    if (!input) return;
    const inTerminal = e.target === input;

    if (e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'l' && (inTerminal || !isEditable(e.target))) {
      e.preventDefault();
      onClear();
      return;
    }

    if (!inTerminal) {
      // Digitou fora de qualquer campo: manda a tecla para o terminal.
      if (!isEditable(e.target) && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) focusInput();
      return;
    }
    if (e.isComposing) return;

    switch (e.key) {
      case 'Enter': {
        e.preventDefault();
        e.stopPropagation();
        const value = input.value;
        writeInput('', { focus: false });
        onSubmit(value);
        break;
      }
      case 'ArrowUp':
      case 'ArrowDown': {
        e.preventDefault();
        e.stopPropagation();
        const next = e.key === 'ArrowUp' ? history.up(input.value) : history.down();
        if (next !== null) writeInput(next);
        break;
      }
      case 'Tab': {
        e.preventDefault();
        e.stopPropagation();
        onTab(input.value);
        break;
      }
      default:
        revealPrompt();
    }
  });

  useEffect(() => {
    const listener = (e) => handle(e);
    document.addEventListener('keydown', listener, true);
    return () => document.removeEventListener('keydown', listener, true);
  }, []);
}
