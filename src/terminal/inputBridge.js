/*
 * Ponte com o input escondido do react-terminal-ui, que não é controlado por fora.
 * Escrevemos com o setter nativo + evento 'input' (assim o onChange do React dispara).
 */
const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
const nativeFocus = HTMLElement.prototype.focus;

export const getInput = () => document.querySelector('.terminal-hidden-input');

export function focusInput() {
  const input = getInput();
  // usa o focus do protótipo: o guard de clique pode ter trocado o da instância
  if (input) nativeFocus.call(input, { preventScroll: true });
}

export function writeInput(value, { focus = true } = {}) {
  const input = getInput();
  if (!input) return;
  valueSetter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  if (focus) focusInput();
  // A lib guarda o deslocamento do cursor e só o recalcula em teclas de seta.
  // Um ArrowRight com o caret no fim zera esse deslocamento.
  requestAnimationFrame(() => {
    try {
      input.setSelectionRange(value.length, value.length);
    } catch {
      /* alguns tipos de input não aceitam seleção */
    }
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  });
}

export const isEditable = (el) =>
  !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

export function revealPrompt() {
  requestAnimationFrame(() => {
    document.querySelector('.react-terminal-active-input')?.scrollIntoView({ block: 'nearest' });
  });
}
